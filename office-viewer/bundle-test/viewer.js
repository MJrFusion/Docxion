(() => {
    'use strict';

    /*
     * This MUST be `let`, not `const`.
     * loadFile() replaces the controller every time
     * a new document is opened.
     */
    let viewer = null;

    const SUPPORTED_EXTENSIONS = new Set([
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
    ]);

    const filePicker = document.getElementById('file-picker');
    const fileName = document.getElementById('file-name');
    const viewerContainer = document.getElementById('viewer');
    const emptyState = document.getElementById('empty-state');
    const status = document.getElementById('status');

    const openButton = document.getElementById('open');
    const previousButton = document.getElementById('previous');
    const nextButton = document.getElementById('next');

    const zoomOutButton = document.getElementById('zoom-out');
    const zoomInButton = document.getElementById('zoom-in');
    const fitWidthButton = document.getElementById('fit-width');
    const fitPageButton = document.getElementById('fit-page');

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search');
    const previousMatchButton = document.getElementById('previous-match');
    const nextMatchButton = document.getElementById('next-match');
    const clearSearchButton = document.getElementById('clear-search');
    const searchCount = document.getElementById('search-count');

    const printButton = document.getElementById('print');
    const lightButton = document.getElementById('light');
    const darkButton = document.getElementById('dark');
    const closeButton = document.getElementById('close');
    const destroyButton = document.getElementById('destroy');

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('error', isError);
    }

    function getFileExtension(file) {
        const name = file.name.toLowerCase();
        const index = name.lastIndexOf('.');
        if (index === -1) {
            return '';
        }
        return name.slice(index);
    }

    function isSupportedFile(file) {
        return file instanceof File && SUPPORTED_EXTENSIONS.has(getFileExtension(file));
    }

    function requireViewer() {
        if (!viewer) {
            throw new Error('Viewer is not initialized.');
        }
        return viewer;
    }

    function updateControls() {
        const enabled = viewer !== null;
        previousButton.disabled = !enabled;
        nextButton.disabled = !enabled;
        zoomOutButton.disabled = !enabled;
        zoomInButton.disabled = !enabled;
        fitWidthButton.disabled = !enabled;
        fitPageButton.disabled = !enabled;
        searchInput.disabled = !enabled;
        searchButton.disabled = !enabled;
        previousMatchButton.disabled = !enabled;
        nextMatchButton.disabled = !enabled;
        clearSearchButton.disabled = !enabled;
        printButton.disabled = !enabled;
        lightButton.disabled = !enabled;
        darkButton.disabled = !enabled;
        closeButton.disabled = !enabled;
        destroyButton.disabled = !enabled;
    }

    function clearSearchUi() {
        searchCount.textContent = '';
    }

    async function loadFile(file) {
        if (!isSupportedFile(file)) {
            const extension = getFileExtension(file) || 'unknown';
            setStatus(
                `Unsupported file type: ${extension}. Only DOCX, XLSX, PPT, and PPTX are supported.`,
                true
            );
            filePicker.value = '';
            return;
        }

        if (viewer) {
            try {
                viewer.destroy();
            } catch (error) {
                console.warn('Failed to destroy previous viewer:', error);
            }
            viewer = null;
        }

        viewerContainer.replaceChildren();
        fileName.textContent = file.name;
        clearSearchUi();
        updateControls();
        setStatus(`Loading ${file.name}...`);

        const options = {
            file: file,
            theme: 'light',
            toolbar: false,
            sidebar: false,
            search: {
                enabled: true,
                maxMatches: 1000,
                caseSensitive: false
            },
            presentation: {
                pptWorkerUrl: new URL('./vendor/ppt/worker.mjs', window.location.href).toString(),
                pptxWorkerUrl: new URL('./vendor/pptx/pptx.worker.js', window.location.href).toString()
            }
        };

        try {
            if (!window.Docxion || typeof window.Docxion.mountViewer !== 'function') {
                throw new Error('Docxion.mountViewer() is not available.');
            }

            viewer = await window.Docxion.mountViewer(viewerContainer, options);
            emptyState?.remove();
            updateControls();
            setStatus(`Loaded ${file.name}`);
        } catch (error) {
            viewer = null;
            updateControls();
            console.error('Failed to initialize viewer:', error);
            setStatus(error instanceof Error ? error.message : String(error), true);
        }
    }

    async function openFilePicker() {
        filePicker.value = '';
        filePicker.click();
    }

    async function previousPage() {
        const api = requireViewer();
        const page = api.getCurrentPage();
        if (page > 1) {
            await api.goToPage(page - 1);
        }
    }

    async function nextPage() {
        const api = requireViewer();
        const page = api.getCurrentPage();
        const totalPages = api.getTotalPages();
        if (page > 0 && page < totalPages) {
            await api.goToPage(page + 1);
        }
    }

    async function zoomOut() {
        await requireViewer().zoomOut();
    }

    async function zoomIn() {
        await requireViewer().zoomIn();
    }

    async function fitWidth() {
        await requireViewer().fitToWidth();
    }

    async function fitPage() {
        await requireViewer().fitToPage();
    }

    async function search() {
        const api = requireViewer();
        const query = searchInput.value.trim();
        if (!query) {
            return;
        }

        setStatus(`Searching for "${query}"...`);

        try {
            const results = await api.search(query);
            const count = Array.isArray(results) ? results.length : 0;
            searchCount.textContent = count > 0 ? `${count} match${count === 1 ? '' : 'es'}` : 'No matches';

            if (count > 0) {
                await api.goToNextMatch();
                setStatus(`${count} match${count === 1 ? '' : 'es'} found`);
            } else {
                setStatus(`No matches for "${query}"`);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setStatus(error instanceof Error ? error.message : String(error), true);
        }
    }

    async function previousMatch() {
        await requireViewer().goToPreviousMatch();
    }

    async function nextMatch() {
        await requireViewer().goToNextMatch();
    }

    function clearSearch() {
        requireViewer().clearSearch();
        searchInput.value = '';
        clearSearchUi();
        setStatus('Search cleared');
    }

    function print() {
        requireViewer().print();
    }

    function setLightTheme() {
        requireViewer().setTheme('light');
        setStatus('Light theme');
    }

    function setDarkTheme() {
        requireViewer().setTheme('dark');
        setStatus('Dark theme');
    }

    function closeFile() {
        requireViewer().closeFile();
        fileName.textContent = 'No document selected';
        searchInput.value = '';
        clearSearchUi();
        setStatus('Document closed');
    }

    function destroyViewer() {
        if (!viewer) {
            return;
        }
        try {
            viewer.destroy();
        } finally {
            viewer = null;
            viewerContainer.replaceChildren();
            fileName.textContent = 'No document selected';
            searchInput.value = '';
            clearSearchUi();
            updateControls();
            setStatus('Viewer destroyed');
        }
    }

    function handleAction(action) {
        Promise.resolve()
            .then(action)
            .catch(error => {
                console.error('Viewer action failed:', error);
                setStatus(error instanceof Error ? error.message : String(error), true);
            });
    }

    // File picker
    filePicker.addEventListener('change', () => {
        const file = filePicker.files?.[0];
        if (!file) {
            return;
        }
        handleAction(() => loadFile(file));
    });

    // Toolbar actions
    openButton.addEventListener('click', () => {
        handleAction(openFilePicker);
    });

    previousButton.addEventListener('click', () => {
        handleAction(previousPage);
    });

    nextButton.addEventListener('click', () => {
        handleAction(nextPage);
    });

    zoomOutButton.addEventListener('click', () => {
        handleAction(zoomOut);
    });

    zoomInButton.addEventListener('click', () => {
        handleAction(zoomIn);
    });

    fitWidthButton.addEventListener('click', () => {
        handleAction(fitWidth);
    });

    fitPageButton.addEventListener('click', () => {
        handleAction(fitPage);
    });

    searchButton.addEventListener('click', () => {
        handleAction(search);
    });

    previousMatchButton.addEventListener('click', () => {
        handleAction(previousMatch);
    });

    nextMatchButton.addEventListener('click', () => {
        handleAction(nextMatch);
    });

    clearSearchButton.addEventListener('click', () => {
        handleAction(clearSearch);
    });

    printButton.addEventListener('click', () => {
        handleAction(print);
    });

    lightButton.addEventListener('click', () => {
        handleAction(setLightTheme);
    });

    darkButton.addEventListener('click', () => {
        handleAction(setDarkTheme);
    });

    closeButton.addEventListener('click', () => {
        handleAction(closeFile);
    });

    destroyButton.addEventListener('click', () => {
        handleAction(destroyViewer);
    });

    // Search keyboard shortcuts
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleAction(search);
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            handleAction(clearSearch);
        }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', event => {
        const target = event.target;
        const isTyping = target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target instanceof HTMLSelectElement;

        if (isTyping || !viewer) {
            return;
        }

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

        if (modifier && event.key.toLowerCase() === 'f') {
            event.preventDefault();
            searchInput.focus();
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
        }
    });

    // Developer console API
    window.viewerDev = {
        state() {
            const api = requireViewer();
            console.log({
                ready: api.isReady(),
                file: api.getCurrentFile(),
                page: api.getCurrentPage(),
                totalPages: api.getTotalPages(),
                zoom: api.getZoom(),
                theme: api.getTheme()
            });
        },
        open(file) {
            return loadFile(file);
        },
        page(page) {
            return requireViewer().goToPage(page);
        },
        zoom(zoom) {
            return requireViewer().setZoom(zoom);
        },
        zoomIn() {
            return requireViewer().zoomIn();
        },
        zoomOut() {
            return requireViewer().zoomOut();
        },
        fitWidth() {
            return requireViewer().fitToWidth();
        },
        fitPage() {
            return requireViewer().fitToPage();
        },
        search(query) {
            searchInput.value = query;
            return search();
        },
        nextMatch() {
            return nextMatch();
        },
        previousMatch() {
            return previousMatch();
        },
        clearSearch() {
            clearSearch();
        },
        print() {
            print();
        },
        light() {
            setLightTheme();
        },
        dark() {
            setDarkTheme();
        },
        close() {
            closeFile();
        },
        destroy() {
            destroyViewer();
        }
    };

    // Initial state
    updateControls();
    window.__viewer = null;
    console.log('Vaultar Office Viewer ready.');
    console.log('Supported formats:', [...SUPPORTED_EXTENSIONS]);
    console.log('Console API:', 'viewerDev.state()', 'viewerDev.search("text")', 'viewerDev.nextMatch()', 'viewerDev.previousMatch()');
})();