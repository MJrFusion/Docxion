import { mountViewer as originalMountViewer } from '@file-viewer/web';
import { wordRenderer } from '@file-viewer/renderer-word';
import { spreadsheetRenderer } from '@file-viewer/renderer-spreadsheet';
import { presentationRenderer } from '@file-viewer/renderer-presentation';

import type {
    SearchResult,
    ViewerAPI,
    ViewerOptions,
} from './types/core';

import {
    getDomSelection,
} from './utils/selection';

import {
    asRecord,
    extractPage,
    extractTotalPages,
    extractZoom,
    getErrorMessage,
    getProperty,
    normalizeSearchResults,
} from './utils/viewer';

import { AndroidJsBridge } from './types/bridge';

type WebViewerController = {
    load?: (options?: unknown) => Promise<void>;
    update?: (options?: unknown) => Promise<void> | void;
    reload?: () => Promise<void>;
    destroy?: () => void;
    subscribe?: (listener: (state: unknown) => void) => (() => void) | void;
    getViewState?: () => unknown;
    applyViewState?: (state: unknown, options?: unknown) => Promise<void> | void;
    zoomIn?: (step?: number) => Promise<void> | void;
    zoomOut?: (step?: number) => Promise<void> | void;
    resetZoom?: () => Promise<void> | void;
    searchDocument?: (query?: string) => Promise<unknown> | unknown;
    nextSearchResult?: () => Promise<void> | void;
    previousSearchResult?: () => Promise<void> | void;
    clearSearch?: () => void;
    printRenderedHtml?: (options?: unknown) => Promise<void> | void;
    downloadOriginalFile?: () => Promise<void> | void;
    getOperationAvailability?: () => unknown;
    getZoomState?: () => unknown;
    getSearchState?: () => unknown;
};

type MountResult = Awaited<ReturnType<typeof originalMountViewer>>;

function asController(value: MountResult): WebViewerController {
    return value as unknown as WebViewerController;
}

/**
 * Calls a search navigation method when the current renderer
 * exposes it.
 *
 * The search result itself is never stored here.
 */
async function navigateSearch(
    controller: WebViewerController,
    direction: 'next' | 'previous'
): Promise<void> {
    const method = direction === 'next'
        ? controller.nextSearchResult
        : controller.previousSearchResult;

    if (typeof method === 'function') {
        await method.call(controller);
        return;
    }

    /*
     * Some renderer/controller versions expose search navigation
     * through the search state rather than top-level methods.
     *
     * We intentionally do not keep our own result array. If the
     * controller does not expose navigation, fail explicitly.
     */
    const searchState = controller.getSearchState?.();
    const state = asRecord(searchState);
    const navigation = asRecord(state?.navigation);
    const navigationMethod = direction === 'next'
        ? navigation?.next
        : navigation?.previous;

    if (typeof navigationMethod === 'function') {
        await navigationMethod.call(searchState);
        return;
    }

    throw new Error('Search-result navigation is not supported by the current viewer renderer.');
}

/**
 * Mounts the file viewer and adapts the official controller API
 * to the ViewerAPI exposed to Android.
 */
export async function mountViewer(
    container: HTMLElement,
    options: ViewerOptions
): Promise<ViewerAPI> {
    if (!container) {
        throw new Error('A viewer container is required.');
    }

    const bridge = new AndroidJsBridge(options.androidBridge);

    const viewerOptions = {
        renderers: [wordRenderer, spreadsheetRenderer, presentationRenderer],
        rendererMode: 'replace',
        toolbar: false,
        sidebar: false,
        presentation: {
            ...options.presentation,
            toolbar: false,
            sidebar: false,
        },
        theme: options.theme ?? 'light',
        search: {
            enabled: true,
            maxMatches: options.search?.maxMatches ?? 1000,
            caseSensitive: options.search?.caseSensitive ?? false,
        },
        onEvent(event: unknown): void {
            handleViewerEvent(event, bridge);
        },
    };

    let controller: WebViewerController;

    try {
        const mounted = await originalMountViewer(
            container,
            {
                file: options.file as never,
                options: viewerOptions as never,
                onEvent: viewerOptions.onEvent,
            } as never
        );

        controller = asController(mounted);
    } catch (error) {
        bridge.error(getErrorMessage(error), 'VIEWER_MOUNT_ERROR');
        throw error;
    }

    if (!controller) {
        throw new Error('The file viewer controller was not created.');
    }

    /*
     * Selection is intentionally handled through the browser's DOM
     * Selection API rather than the file viewer event API.
     *
     * The listener is installed only after the viewer has been
     * successfully mounted.
     */
    const handleSelectionChange = (): void => {
        const selection = getDomSelection(
            (message) => bridge.log(message)
        );

        bridge.log(`[Docxion] DOM selection changed: ${JSON.stringify(selection)}`);
        bridge.log(`[Docxion] activeElement: ${document.activeElement?.outerHTML?.slice(0, 500)}`);

        bridge.textSelected(selection);
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    const unsubscribe = controller.subscribe?.((state: unknown) => {
        const page = extractPage(state);
        if (page !== undefined) {
            bridge.pageChanged(page, extractTotalPages(state));
        }
        const zoom = extractZoom(getProperty(state, 'zoom'));
        if (zoom !== undefined) {
            bridge.zoomChanged(zoom);
        }
    });

    let currentFile: File | string | null = options.file ?? null;
    let destroyed = false;

    const api: ViewerAPI = {
        async openFile(file: File | string): Promise<void> {
            if (destroyed) {
                throw new Error('Viewer has been destroyed.');
            }
            currentFile = file;
            if (typeof controller.update === 'function') {
                await controller.update({ file });
                return;
            }
            if (typeof controller.load === 'function') {
                await controller.load({ file });
                return;
            }
            throw new Error('Opening another file is not supported by the viewer controller.');
        },

        closeFile(): void {
            currentFile = null;
            if (typeof controller.update === 'function') {
                void controller.update({ file: null });
            }
        },

        getCurrentFile(): File | string | null {
            return currentFile;
        },

        async goToPage(page: number): Promise<void> {
            if (!Number.isFinite(page) || page < 1) {
                throw new RangeError('Page must be a positive number.');
            }
            const currentState = controller.getViewState?.();
            const state = asRecord(currentState);
            if (typeof controller.applyViewState === 'function' && state) {
                await controller.applyViewState(
                    { ...state, page },
                    { source: 'api', action: 'go-to-page' }
                );
                return;
            }
            throw new Error('Page navigation is not supported by the viewer controller.');
        },

        getCurrentPage(): number {
            return extractPage(controller.getViewState?.()) ?? 0;
        },

        getTotalPages(): number {
            return extractTotalPages(controller.getViewState?.());
        },

        async setZoom(zoom: number): Promise<void> {
            if (!Number.isFinite(zoom) || zoom <= 0) {
                throw new RangeError('Zoom must be a positive number.');
            }
            const currentZoom = api.getZoom();
            if (zoom === currentZoom) {
                return;
            }
            if (zoom < currentZoom) {
                while (api.getZoom() > zoom) {
                    const before = api.getZoom();
                    if (typeof controller.zoomOut !== 'function') {
                        throw new Error('Zoom-out is not supported by the viewer.');
                    }
                    await controller.zoomOut();
                    const after = api.getZoom();
                    if (after >= before) {
                        break;
                    }
                }
                return;
            }
            while (api.getZoom() < zoom) {
                const before = api.getZoom();
                if (typeof controller.zoomIn !== 'function') {
                    throw new Error('Zoom-in is not supported by the viewer.');
                }
                await controller.zoomIn();
                const after = api.getZoom();
                if (after <= before) {
                    break;
                }
            }
        },

        getZoom(): number {
            const state = controller.getViewState?.();
            return extractZoom(getProperty(state, 'zoom')) ?? 1;
        },

        async zoomIn(step?: number): Promise<void> {
            if (typeof controller.zoomIn !== 'function') {
                throw new Error('Zoom-in is not supported by the viewer.');
            }
            await controller.zoomIn(step);
        },

        async zoomOut(step?: number): Promise<void> {
            if (typeof controller.zoomOut !== 'function') {
                throw new Error('Zoom-out is not supported by the viewer.');
            }
            await controller.zoomOut(step);
        },

        async fitToWidth(): Promise<void> {
            if (typeof controller.resetZoom !== 'function') {
                throw new Error('Fit-to-width is not supported by the viewer controller.');
            }
            await controller.resetZoom();
        },

        async fitToPage(): Promise<void> {
            if (typeof controller.resetZoom !== 'function') {
                throw new Error('Fit-to-page is not supported by the viewer controller.');
            }
            await controller.resetZoom();
        },

        async search(query: string): Promise<SearchResult[]> {
            const normalizedQuery = query.trim();
            if (!normalizedQuery) {
                return [];
            }
            if (typeof controller.searchDocument !== 'function') {
                throw new Error('Search is not supported by the viewer controller.');
            }
            const rawResults = await controller.searchDocument(normalizedQuery);
            return normalizeSearchResults(rawResults);
        },

        clearSearch(): void {
            controller.clearSearch?.();
        },

        async goToNextMatch(): Promise<void> {
            await navigateSearch(controller, 'next');
        },

        async goToPreviousMatch(): Promise<void> {
            await navigateSearch(controller, 'previous');
        },

        getSelectedText(): string | null {
            return null;
        },

        clearSelection(): void {
            // No documented controller operation currently exposes clearing renderer selection.
        },

        setTheme(theme: 'light' | 'dark'): void {
            if (typeof controller.update !== 'function') {
                throw new Error('Changing the theme is not supported by the viewer controller.');
            }
            void controller.update({
                options: {
                    theme,
                    toolbar: false,
                    sidebar: false,
                    presentation: {
                        ...options.presentation,
                        toolbar: false,
                        sidebar: false,
                    },
                },
            });
        },

        getTheme(): 'light' | 'dark' {
            const theme = getProperty(controller.getViewState?.(), 'theme');
            if (theme === 'dark' || theme === 'light') {
                return theme;
            }
            return options.theme ?? 'light';
        },

        print(): void {
            if (typeof controller.printRenderedHtml !== 'function') {
                throw new Error('Printing is not supported by the viewer controller.');
            }
            void controller.printRenderedHtml();
        },

        destroy(): void {
            if (destroyed) {
                return;
            }
            destroyed = true;
            document.removeEventListener('selectionchange', handleSelectionChange);
            unsubscribe?.();
            controller.destroy?.();
            currentFile = null;
            if (container.isConnected) {
                container.replaceChildren();
            }
        },

        isReady(): boolean {
            return !destroyed;
        },
    };

    bridge.ready(Date.now());
    return api;
}

function handleViewerEvent(event: unknown, bridge: AndroidJsBridge): void {
    bridge.log(`[Docxion] Viewer event: ${JSON.stringify(event)}`);

    const value = asRecord(event);
    if (!value) {
        bridge.log('[Docxion] Viewer event ignored: invalid event.');
        return;
    }

    const type = String(value.type);
    bridge.log(`[Docxion] Viewer event type: ${type}`);

    if (type === 'error') {
        const detail = asRecord(value.detail);
        if (typeof detail?.message !== 'string') {
            bridge.log('[Docxion] Error event ignored: missing message.');
            return;
        }
        bridge.error(detail.message, typeof detail.code === 'string' ? detail.code : undefined);
        return;
    }
}

export default {
    mountViewer,
};