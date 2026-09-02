import { mountViewer } from '../index';
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

let viewer: ViewerAPI | null = null;
const baseUrl = new URL('/', window.location.href);

function requireViewer(): ViewerAPI {
    if (!viewer) {
        throw new Error('Viewer is not initialized.');
    }
    return viewer;
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
}

async function loadFile(file: File): Promise<void> {
    viewer?.destroy();
    viewer = null;
    viewerContainer.replaceChildren();
    fileName.textContent = file.name;
    updateControls();

    const options: ViewerOptions = {
        file,
        theme: 'light',
        search: {
            maxMatches: 1000,
            caseSensitive: false,
        },
        presentation: {
            pptWorkerUrl: new URL('vendor/ppt/worker.mjs', baseUrl).toString(),
            pptxWorkerUrl: new URL('vendor/pptx/pptx.worker.js', baseUrl).toString(),
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
    requireViewer().print();
}

function setLightTheme(): void {
    requireViewer().setTheme('light');
}

function setDarkTheme(): void {
    requireViewer().setTheme('dark');
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

document.addEventListener('keydown', (event: KeyboardEvent): void => {
    if (!viewer) {
        return;
    }

    const target = event.target as HTMLElement | null;
    const isInput = target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
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
        return;
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
        requireViewer().print();
    },

    light(): void {
        requireViewer().setTheme('light');
    },

    dark(): void {
        requireViewer().setTheme('dark');
    },

    close(): void {
        requireViewer().closeFile();
    },

    destroy(): void {
        destroyViewer();
    },
};

updateControls();

console.log([
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
    '  viewerDev.close()',
    '  viewerDev.destroy()',
].join('\n'));