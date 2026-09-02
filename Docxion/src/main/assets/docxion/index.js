(() => {
    'use strict';

    let viewer = null;

    const viewerContainer =
        document.getElementById('viewer');

    const debug =
        document.getElementById('debug');

    function updateViewportHeight() {
        const height = window.innerHeight;

        document.documentElement.style.height = `${height}px`;
        document.body.style.height = `${height}px`;
        viewerContainer.style.height = `${height}px`;

        console.log(
            "Viewport height applied:",
            height,
            "body=",
            document.body.clientHeight,
            "viewer=",
            viewerContainer.clientHeight
        );
    }

    updateViewportHeight();

    window.addEventListener(
        'resize',
        updateViewportHeight
    );

    function logDebug(message) {
        console.log(message);
        debug.textContent = String(message);
    }

    function requireViewer() {
        if (!viewer) {
            throw new Error(
                'Docxion viewer is not initialized.'
            );
        }

        return viewer;
    }

    function createAndroidBridge() {
        return {
            log(message) {
                window.DocxionAndroid?.log(
                    String(message)
                );
            },

            onPageChanged(page, totalPages) {
                window.DocxionAndroid?.onPageChanged(
                    Number(page),
                    Number(totalPages)
                );
            },

            onZoomChanged(zoom) {
                window.DocxionAndroid?.onZoomChanged(
                    Number(zoom)
                );
            },

            onTextSelected(text) {
                window.DocxionAndroid?.onTextSelected(
                    text == null
                        ? null
                        : String(text)
                );
            },

            onReady(timestamp) {
                window.DocxionAndroid?.onReady(
                    Number(timestamp)
                );
            },

            onError(message, code) {
                window.DocxionAndroid?.onError(
                    String(message),
                    code == null
                        ? null
                        : String(code)
                );
            }
        };
    }

    async function mount(
        file = undefined,
        theme = 'light'
    ) {
        if (
            !window.Docxion ||
            typeof window.Docxion.mountViewer !== 'function'
        ) {
            throw new Error(
                'Docxion.mountViewer() is not available.'
            );
        }

        if (viewer) {
            viewer.destroy();
            viewer = null;
        }

        viewerContainer.replaceChildren();

        logDebug(
            `Before mount: ${viewerContainer.clientWidth}x${viewerContainer.clientHeight}`
        );

        console.log(
            "Viewport:",
            "inner=",
            window.innerWidth,
            window.innerHeight,
            "document=",
            document.documentElement.clientWidth,
            document.documentElement.clientHeight,
            "body=",
            document.body.clientWidth,
            document.body.clientHeight,
            "viewer=",
            viewerContainer.clientWidth,
            viewerContainer.clientHeight,
            "rect=",
            viewerContainer.getBoundingClientRect().width,
            viewerContainer.getBoundingClientRect().height
        );

        console.log(
            "Computed body:",
            getComputedStyle(document.body).display,
            getComputedStyle(document.body).position,
            getComputedStyle(document.body).width,
            getComputedStyle(document.body).height
        );

        console.log(
            "Computed viewer:",
            getComputedStyle(viewerContainer).display,
            getComputedStyle(viewerContainer).position,
            getComputedStyle(viewerContainer).width,
            getComputedStyle(viewerContainer).height
        );

        viewer = await window.Docxion.mountViewer(
            viewerContainer,
            {
                file,
                theme,

                search: {
                    maxMatches: 1000,
                    caseSensitive: false
                },

                presentation: {
                    pptWorkerUrl: new URL(
                        './vendor/ppt/worker.mjs',
                        window.location.href
                    ).toString(),

                    pptxWorkerUrl: new URL(
                        './vendor/pptx/pptx.worker.js',
                        window.location.href
                    ).toString()
                },

                androidBridge:
                    createAndroidBridge()
            }
        );

        console.log(
            'Docxion children:',
            viewerContainer.children.length
        );

        console.log(
            'Docxion HTML:',
            viewerContainer.innerHTML
        );

        for (const child of viewerContainer.children) {
            console.log(
                'Docxion child:',
                child.tagName,
                child.className,
                'width:',
                child.clientWidth,
                'height:',
                child.clientHeight,
                'computedWidth:',
                getComputedStyle(child).width,
                'computedHeight:',
                getComputedStyle(child).height
            );
        }

        logDebug(
            `Mounted: ${viewerContainer.clientWidth}x${viewerContainer.clientHeight}, children=${viewerContainer.children.length}, ready=${viewer.isReady()}`
        );

        return true;
    }

    window.docxionApi = {

        openFile(file) {
            return requireViewer().openFile(file);
        },

        closeFile() {
            requireViewer().closeFile();
        },

        getCurrentFile() {
            return requireViewer().getCurrentFile();
        },

        goToPage(page) {
            return requireViewer().goToPage(page);
        },

        getCurrentPage() {
            return requireViewer().getCurrentPage();
        },

        getTotalPages() {
            return requireViewer().getTotalPages();
        },

        setZoom(zoom) {
            return requireViewer().setZoom(zoom);
        },

        getZoom() {
            return requireViewer().getZoom();
        },

        zoomIn(step) {
            return requireViewer().zoomIn(step);
        },

        zoomOut(step) {
            return requireViewer().zoomOut(step);
        },

        fitToWidth() {
            return requireViewer().fitToWidth();
        },

        fitToPage() {
            return requireViewer().fitToPage();
        },

        search(query) {
            return requireViewer().search(query);
        },

        clearSearch() {
            requireViewer().clearSearch();
        },

        goToNextMatch() {
            requireViewer().goToNextMatch();
        },

        goToPreviousMatch() {
            requireViewer().goToPreviousMatch();
        },

        getSelectedText() {
            return requireViewer().getSelectedText();
        },

        clearSelection() {
            requireViewer().clearSelection();
        },

        setTheme(theme) {
            requireViewer().setTheme(theme);
        },

        getTheme() {
            return requireViewer().getTheme();
        },

        print() {
            requireViewer().print();
        },

        destroy() {
            if (!viewer) {
                return;
            }

            viewer.destroy();

            viewer = null;

            viewerContainer.replaceChildren();
        },

        isReady() {
            return (
                viewer !== null &&
                viewer.isReady()
            );
        }
    };

    mount()
        .catch(error => {
            console.error(
                'Failed to mount Docxion:',
                error
            );

            debug.textContent =
                'MOUNT ERROR: ' +
                String(
                    error?.message ?? error
                );

            window.DocxionAndroid?.onError(
                String(
                    error?.message ?? error
                ),
                'MOUNT_ERROR'
            );
        });

    window.DocxionHostReady = true;
})();