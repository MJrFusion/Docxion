import { mountViewer } from '../index';
import { CaptureAspectRatio, Theme } from '../types/core';
import type { ViewerAPI, ViewerOptions } from '../types/core';

function requireElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Required development element "${selector}" was not found.`);
    }
    return element;
}

const filePicker = requireElement<HTMLInputElement>('#file-picker');
const fileName = requireElement<HTMLElement>('#file-name');
const viewerContainer = requireElement<HTMLElement>('#viewer');

const openButton = requireElement<HTMLButtonElement>('#open');
const previousButton = requireElement<HTMLButtonElement>('#previous');
const nextButton = requireElement<HTMLButtonElement>('#next');

const zoomOutButton = requireElement<HTMLButtonElement>('#zoom-out');
const zoomInButton = requireElement<HTMLButtonElement>('#zoom-in');
const fitWidthButton = requireElement<HTMLButtonElement>('#fit-width');
const fitPageButton = requireElement<HTMLButtonElement>('#fit-page');

const searchInput = requireElement<HTMLInputElement>('#search-input');
const searchButton = requireElement<HTMLButtonElement>('#search');
const previousMatchButton = requireElement<HTMLButtonElement>('#previous-match');
const nextMatchButton = requireElement<HTMLButtonElement>('#next-match');
const clearSearchButton = requireElement<HTMLButtonElement>('#clear-search');

const printButton = requireElement<HTMLButtonElement>('#print');

const lightButton = requireElement<HTMLButtonElement>('#light');
const darkButton = requireElement<HTMLButtonElement>('#dark');

const closeButton = requireElement<HTMLButtonElement>('#close');
const destroyButton = requireElement<HTMLButtonElement>('#destroy');

const captureSizeButton = requireElement<HTMLButtonElement>('#capture-size');
const captureHeightButton = requireElement<HTMLButtonElement>('#capture-height');

const capture11Button = requireElement<HTMLButtonElement>('#capture-1-1');
const capture169Button = requireElement<HTMLButtonElement>('#capture-16-9');
const capture916Button = requireElement<HTMLButtonElement>('#capture-9-16');
const capture43Button = requireElement<HTMLButtonElement>('#capture-4-3');
const capture34Button = requireElement<HTMLButtonElement>('#capture-3-4');
const capture32Button = requireElement<HTMLButtonElement>('#capture-3-2');

let viewer: ViewerAPI | null = null;

const baseUrl = new URL('/', window.location.href);

function requireViewer(): ViewerAPI {
    if (!viewer) {
        throw new Error('Viewer is not initialized.');
    }
    return viewer;
}

function setStatus(message: string): void {
    const status = document.querySelector<HTMLOutputElement>('#status');
    if (status) {
        status.value = message;
    }
    console.log(`[Status] ${message}`);
}

function downloadCapture(bytes: Uint8Array, filename: string): void {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);

    const blob = new Blob([buffer], { type: 'image/png' });
    const url = URL.createObjectURL(blob);

    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function captureWithDimensions(): Promise<void> {
    const api = requireViewer();
    const widthInput = window.prompt('Capture width:', '1280');
    if (widthInput === null) {
        return;
    }
    const heightInput = window.prompt('Capture height:', '720');
    if (heightInput === null) {
        return;
    }
    const width = Number(widthInput);
    const height = Number(heightInput);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        setStatus('Invalid capture dimensions.');
        return;
    }
    try {
        setStatus(`Capturing ${width}×${height}...`);
        const bytes = await api.capture(width, height);
        downloadCapture(bytes, `docxion-capture-${width}x${height}.png`);
        setStatus(`Captured ${width}×${height} PNG.`);
    } catch (error) {
        console.error('Capture failed:', error);
        setStatus(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function captureWithHeight(): Promise<void> {
    const api = requireViewer();
    const heightInput = window.prompt('Capture height:', '720');
    if (heightInput === null) {
        return;
    }
    const height = Number(heightInput);
    if (!Number.isFinite(height) || height <= 0) {
        setStatus('Invalid capture height.');
        return;
    }
    try {
        setStatus(`Capturing viewer at height ${height}...`);
        const bytes = await api.capture(height);
        downloadCapture(bytes, `docxion-capture-height-${height}.png`);
        setStatus(`Captured viewer at height ${height}.`);
    } catch (error) {
        console.error('Capture failed:', error);
        setStatus(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function captureWithAspectRatio(aspectRatio: CaptureAspectRatio): Promise<void> {
    const api = requireViewer();
    try {
        setStatus(`Capturing ${aspectRatio}...`);
        const bytes = await api.capture(aspectRatio);
        const filenameRatio = aspectRatio.replace(':', 'x');
        downloadCapture(bytes, `docxion-capture-${filenameRatio}.png`);
        setStatus(`Captured ${aspectRatio} PNG.`);
    } catch (error) {
        console.error(`Capture ${aspectRatio} failed:`, error);
        setStatus(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function updateControls(): void {
    const disabled = viewer === null;

    previousButton.disabled = disabled;
    nextButton.disabled = disabled;

    zoomOutButton.disabled = disabled;
    zoomInButton.disabled = disabled;
    fitWidthButton.disabled = disabled;
    fitPageButton.disabled = disabled;

    searchButton.disabled = disabled;
    previousMatchButton.disabled = disabled;
    nextMatchButton.disabled = disabled;
    clearSearchButton.disabled = disabled;

    printButton.disabled = disabled;

    lightButton.disabled = disabled;
    darkButton.disabled = disabled;

    closeButton.disabled = disabled;
    destroyButton.disabled = disabled;

    captureSizeButton.disabled = disabled;
    captureHeightButton.disabled = disabled;

    capture11Button.disabled = disabled;
    capture169Button.disabled = disabled;
    capture916Button.disabled = disabled;
    capture43Button.disabled = disabled;
    capture34Button.disabled = disabled;
    capture32Button.disabled = disabled;
}

async function loadFile(file: File): Promise<void> {
    viewer?.destroy();
    viewer = null;
    viewerContainer.replaceChildren();
    fileName.textContent = file.name;
    updateControls();

    const options: ViewerOptions = {
        file,
        theme: Theme.LIGHT,
        search: {
            maxMatches: 1000,
            caseSensitive: false,
        },
        presentation: {
            pptWorkerUrl: new URL('vendor/ppt/worker.mjs', baseUrl).toString(),
            pptxWorkerUrl: new URL('vendor/pptx/pptx.worker.js', baseUrl).toString(),
        },
        androidBridge: {
            log(message: string): void {
                console.log('[Bridge] log:', message);
            },
            onPageChanged(page: number, totalPages: number): void {
                console.log('[Bridge] Page changed:', { page, totalPages });
            },
            onZoomChanged(zoom: number): void {
                console.log('[Bridge] Zoom changed:', zoom);
            },
            onTextSelected(selection): void {
                console.log('[Bridge] Selection:', selection);
            },
            onReady(timestamp: number): void {
                console.log('[Bridge] Ready:', timestamp);
            },
            onError(message: string, code?: string): void {
                console.error('[Bridge] Error:', { message, code });
            },
        },
    };

    try {
        viewer = await mountViewer(viewerContainer, options);
        updateControls();
        console.log('Viewer ready.');
    } catch (error) {
        viewer = null;
        updateControls();
        console.error('Failed to initialize viewer:', error);
    }
}

async function openSelectedFile(): Promise<void> {
    filePicker.value = '';
    filePicker.click();
}

async function previousPage(): Promise<void> {
    const api = requireViewer();
    const page = api.getCurrentPage();
    if (page > 1) {
        await api.goToPage(page - 1);
    }
}

async function nextPage(): Promise<void> {
    const api = requireViewer();
    const page = api.getCurrentPage();
    const totalPages = api.getTotalPages();
    if (page > 0 && page < totalPages) {
        await api.goToPage(page + 1);
    }
}

async function zoomOut(): Promise<void> {
    await requireViewer().zoomOut();
}

async function zoomIn(): Promise<void> {
    await requireViewer().zoomIn();
}

async function fitWidth(): Promise<void> {
    await requireViewer().fitToWidth();
}

async function fitPage(): Promise<void> {
    await requireViewer().fitToPage();
}

async function search(): Promise<void> {
    const api = requireViewer();
    const query = searchInput.value.trim();
    if (!query) {
        return;
    }
    try {
        const results = await api.search(query);
        console.log('Search results:', results);
        if (results.length > 0) {
            await api.goToNextMatch();
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}

async function nextMatch(): Promise<void> {
    await requireViewer().goToNextMatch();
}

async function previousMatch(): Promise<void> {
    await requireViewer().goToPreviousMatch();
}

function clearSearch(): void {
    requireViewer().clearSearch();
    searchInput.value = '';
}

function print(): void {
    console.log('Print requested.');
    requireViewer().print();
}

function setLightTheme(): void {
    requireViewer().setTheme(Theme.LIGHT);
}

function setDarkTheme(): void {
    requireViewer().setTheme(Theme.DARK);
}

function closeFile(): void {
    requireViewer().closeFile();
    fileName.textContent = 'No document selected';
}

function destroyViewer(): void {
    if (!viewer) {
        return;
    }
    viewer.destroy();
    viewer = null;
    viewerContainer.replaceChildren();
    fileName.textContent = 'No document selected';
    searchInput.value = '';
    updateControls();
    console.log('Viewer destroyed.');
}

function handleAction(action: () => void | Promise<void>): void {
    Promise.resolve()
        .then(action)
        .catch((error: unknown) => {
            console.error('Viewer action failed:', error);
        });
}

filePicker.addEventListener('change', (): void => {
    const file = filePicker.files?.[0];
    if (!file) {
        return;
    }
    handleAction(() => loadFile(file));
});

openButton.addEventListener('click', (): void => {
    handleAction(openSelectedFile);
});

previousButton.addEventListener('click', (): void => {
    handleAction(previousPage);
});

nextButton.addEventListener('click', (): void => {
    handleAction(nextPage);
});

zoomOutButton.addEventListener('click', (): void => {
    handleAction(zoomOut);
});

zoomInButton.addEventListener('click', (): void => {
    handleAction(zoomIn);
});

fitWidthButton.addEventListener('click', (): void => {
    handleAction(fitWidth);
});

fitPageButton.addEventListener('click', (): void => {
    handleAction(fitPage);
});

searchButton.addEventListener('click', (): void => {
    handleAction(search);
});

previousMatchButton.addEventListener('click', (): void => {
    handleAction(previousMatch);
});

nextMatchButton.addEventListener('click', (): void => {
    handleAction(nextMatch);
});

clearSearchButton.addEventListener('click', (): void => {
    handleAction(clearSearch);
});

searchInput.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (event.key !== 'Enter') {
        return;
    }
    event.preventDefault();
    handleAction(search);
});

printButton.addEventListener('click', (): void => {
    handleAction(print);
});

lightButton.addEventListener('click', (): void => {
    handleAction(setLightTheme);
});

darkButton.addEventListener('click', (): void => {
    handleAction(setDarkTheme);
});

closeButton.addEventListener('click', (): void => {
    handleAction(closeFile);
});

destroyButton.addEventListener('click', (): void => {
    handleAction(destroyViewer);
});

captureSizeButton.addEventListener('click', (): void => {
    handleAction(captureWithDimensions);
});

captureHeightButton.addEventListener('click', (): void => {
    handleAction(captureWithHeight);
});

capture11Button.addEventListener('click', (): void => {
    handleAction(() => captureWithAspectRatio(CaptureAspectRatio.RATIO_1_1));
});

capture169Button.addEventListener('click', (): void => {
    handleAction(() => captureWithAspectRatio(CaptureAspectRatio.RATIO_16_9));
});

capture916Button.addEventListener('click', (): void => {
    handleAction(() => captureWithAspectRatio(CaptureAspectRatio.RATIO_9_16));
});

capture43Button.addEventListener('click', (): void => {
    handleAction(() => captureWithAspectRatio(CaptureAspectRatio.RATIO_4_3));
});

capture34Button.addEventListener('click', (): void => {
    handleAction(() => captureWithAspectRatio(CaptureAspectRatio.RATIO_3_4));
});

capture32Button.addEventListener('click', (): void => {
    handleAction(() => captureWithAspectRatio(CaptureAspectRatio.RATIO_3_2));
});

document.addEventListener('selectionchange', (): void => {
    requestAnimationFrame(() => {
        const selection = window.getSelection();
        console.log('[Native Selection]', {
            text: selection?.toString(),
            type: selection?.type,
            rangeCount: selection?.rangeCount,
            isCollapsed: selection?.isCollapsed,
            anchorNode: selection?.anchorNode,
            anchorOffset: selection?.anchorOffset,
            focusNode: selection?.focusNode,
            focusOffset: selection?.focusOffset,
        });
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            console.log('[Native Range]', {
                text: range.toString(),
                collapsed: range.collapsed,
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset,
                rects: Array.from(range.getClientRects()),
            });
        }
    });
});

document.addEventListener('mouseup', (event) => {
    const range = document.caretRangeFromPoint(event.clientX, event.clientY);
    console.log({
        x: event.clientX,
        y: event.clientY,
        node: range?.startContainer,
        offset: range?.startOffset,
        text: range?.startContainer?.textContent,
    });
});

document.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (!viewer) {
        return;
    }
    const target = event.target as HTMLElement | null;
    const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
    const modifier = event.ctrlKey || event.metaKey;

    if (modifier && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        handleAction(zoomIn);
        return;
    }
    if (modifier && event.key === '-') {
        event.preventDefault();
        handleAction(zoomOut);
        return;
    }
    if (modifier && event.key === '0') {
        event.preventDefault();
        handleAction(fitWidth);
        return;
    }
    if (isInput) {
        return;
    }
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handleAction(previousPage);
        return;
    }
    if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleAction(nextPage);
        return;
    }
    if (modifier && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchInput.focus();
    }
});

(window as Window & { __viewer?: ViewerAPI | null }).__viewer = null;

(window as Window & {
    viewerDev?: {
        state(): void;
        open(file: File): Promise<void>;
        page(page: number): Promise<void>;
        zoom(zoom: number): Promise<void>;
        zoomIn(step?: number): Promise<void>;
        zoomOut(step?: number): Promise<void>;
        fitWidth(): Promise<void>;
        fitPage(): Promise<void>;
        search(query: string): Promise<unknown[]>;
        nextMatch(): Promise<void>;
        previousMatch(): Promise<void>;
        clearSearch(): void;
        print(): void;
        light(): void;
        dark(): void;
        capture(width: number, height: number): Promise<void>;
        captureHeight(height: number): Promise<void>;
        captureRatio(aspectRatio: CaptureAspectRatio): Promise<void>;
        capture11(): Promise<void>;
        capture169(): Promise<void>;
        capture916(): Promise<void>;
        capture43(): Promise<void>;
        capture34(): Promise<void>;
        capture32(): Promise<void>;
        close(): void;
        destroy(): void;
    };
}).viewerDev = {
    state(): void {
        const api = requireViewer();
        console.log('Viewer:', {
            ready: api.isReady(),
            file: api.getCurrentFile(),
            page: api.getCurrentPage(),
            totalPages: api.getTotalPages(),
            zoom: api.getZoom(),
            theme: api.getTheme(),
            selectedText: api.getSelectedText(),
        });
    },

    async open(file: File): Promise<void> {
        await requireViewer().openFile(file);
    },

    async page(page: number): Promise<void> {
        await requireViewer().goToPage(page);
    },

    async zoom(zoom: number): Promise<void> {
        await requireViewer().setZoom(zoom);
    },

    async zoomIn(step?: number): Promise<void> {
        await requireViewer().zoomIn(step);
    },

    async zoomOut(step?: number): Promise<void> {
        await requireViewer().zoomOut(step);
    },

    async fitWidth(): Promise<void> {
        await requireViewer().fitToWidth();
    },

    async fitPage(): Promise<void> {
        await requireViewer().fitToPage();
    },

    async search(query: string): Promise<unknown[]> {
        return requireViewer().search(query);
    },

    async nextMatch(): Promise<void> {
        await requireViewer().goToNextMatch();
    },

    async previousMatch(): Promise<void> {
        await requireViewer().goToPreviousMatch();
    },

    clearSearch(): void {
        requireViewer().clearSearch();
    },

    print(): void {
        print();
    },

    light(): void {
        requireViewer().setTheme(Theme.LIGHT);
    },

    dark(): void {
        requireViewer().setTheme(Theme.DARK);
    },

    async capture(width: number, height: number): Promise<void> {
        const bytes = await requireViewer().capture(width, height);
        downloadCapture(bytes, `docxion-capture-${width}x${height}.png`);
    },

    async captureHeight(height: number): Promise<void> {
        const bytes = await requireViewer().capture(height);
        downloadCapture(bytes, `docxion-capture-height-${height}.png`);
    },

    async captureRatio(aspectRatio: CaptureAspectRatio): Promise<void> {
        const bytes = await requireViewer().capture(aspectRatio);
        const filenameRatio = aspectRatio.replace(':', 'x');
        downloadCapture(bytes, `docxion-capture-${filenameRatio}.png`);
    },

    async capture11(): Promise<void> {
        await this.captureRatio(CaptureAspectRatio.RATIO_1_1);
    },

    async capture169(): Promise<void> {
        await this.captureRatio(CaptureAspectRatio.RATIO_16_9);
    },

    async capture916(): Promise<void> {
        await this.captureRatio(CaptureAspectRatio.RATIO_9_16);
    },

    async capture43(): Promise<void> {
        await this.captureRatio(CaptureAspectRatio.RATIO_4_3);
    },

    async capture34(): Promise<void> {
        await this.captureRatio(CaptureAspectRatio.RATIO_3_4);
    },

    async capture32(): Promise<void> {
        await this.captureRatio(CaptureAspectRatio.RATIO_3_2);
    },

    close(): void {
        requireViewer().closeFile();
    },

    destroy(): void {
        destroyViewer();
    },
};

updateControls();

console.log(
    [
        'Vaultar viewer development harness ready.',
        '',
        'Use the development toolbar to control the viewer.',
        '',
        'Console API is also available:',
        '  __viewer',
        '  viewerDev.state()',
        '  viewerDev.page(2)',
        '  viewerDev.zoom(1.5)',
        '  viewerDev.zoomIn()',
        '  viewerDev.zoomOut()',
        '  viewerDev.fitWidth()',
        '  viewerDev.fitPage()',
        '  viewerDev.search("text")',
        '  viewerDev.nextMatch()',
        '  viewerDev.previousMatch()',
        '  viewerDev.clearSearch()',
        '  viewerDev.print()',
        '  viewerDev.light()',
        '  viewerDev.dark()',
        '  viewerDev.capture(1280, 720)',
        '  viewerDev.captureHeight(720)',
        '  viewerDev.capture11()',
        '  viewerDev.capture169()',
        '  viewerDev.capture916()',
        '  viewerDev.capture43()',
        '  viewerDev.capture34()',
        '  viewerDev.capture32()',
        '  viewerDev.close()',
        '  viewerDev.destroy()',
    ].join('\n')
);