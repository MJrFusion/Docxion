/**
 * Docxion WebView host shell.
 *
 * This shell binds the Docxion TypeScript viewer library to the
 * Android WebView host.
 *
 * The Docxion TypeScript library exposes the viewer API and its
 * strongly-typed callback data. This shell does not implement
 * viewer functionality or redefine that data. It forwards API
 * operations to the mounted viewer and adapts callback values for
 * the Android JavaScript bridge.
 *
 * Android -> JavaScript:
 *
 *     Android DocxionWebViewApi
 *         -> window.docxionApi
 *         -> Docxion ViewerAPI
 *
 * JavaScript -> Android:
 *
 *     Docxion AndroidCallbacks
 *         -> WebView host shell
 *         -> window.DocxionAndroid
 *         -> Android DocxionJsBridge
 *
 * Structured callback values exposed by the TypeScript library are
 * serialized only at the JavaScript-to-Android boundary, where the
 * WebView JavaScript interface accepts Java-compatible values.
 */
(() => {
    'use strict';

    /**
     * Currently mounted Docxion TypeScript viewer.
     *
     * This is the implementation of the ViewerAPI exposed by
     * `window.Docxion.mountViewer()`.
     */
    let viewer = null;

    /**
     * DOM element hosting the Docxion viewer.
     */
    const viewerContainer =
        document.getElementById('viewer');

    /**
     * Debug output element used by the host page.
     */
    const debug =
        document.getElementById('debug');

    /**
     * Forwards a log message to Android.
     *
     * The host shell does not use the browser console for logging.
     *
     * @param {unknown} message message to log
     */
    function log(message) {
        window.DocxionAndroid?.log(
            String(message)
        );
    }

    /**
     * Forwards an error to Android.
     *
     * @param {unknown} message error message
     * @param {string|null} code optional error code
     */
    function reportError(message, code = null) {
        window.DocxionAndroid?.onError(
            String(message),
            code == null
                ? null
                : String(code)
        );
    }

    /**
     * Keeps the viewer host synchronized with the WebView viewport.
     */
    function updateViewportHeight() {
        const height = window.innerHeight;

        document.documentElement.style.height = `${height}px`;
        document.body.style.height = `${height}px`;
        viewerContainer.style.height = `${height}px`;

        log(
            `Viewport height applied: ${height}, ` +
            `body=${document.body.clientHeight}, ` +
            `viewer=${viewerContainer.clientHeight}`
        );
    }

    updateViewportHeight();

    window.addEventListener(
        'resize',
        updateViewportHeight
    );

    /**
     * Writes a message to Android and the host page's debug element.
     *
     * @param {unknown} message message to display
     */
    function logDebug(message) {
        log(message);
        debug.textContent = String(message);
    }

    /**
     * Returns the currently mounted viewer.
     *
     * @throws {Error} if the viewer has not been mounted
     */
    function requireViewer() {
        if (!viewer) {
            throw new Error(
                'Docxion viewer is not initialized.'
            );
        }

        return viewer;
    }

    /**
     * Creates the AndroidCallbacks adapter consumed by the
     * Docxion TypeScript viewer.
     *
     * The TypeScript viewer communicates with this object using its
     * native callback interfaces. This adapter then forwards those
     * callbacks to `window.DocxionAndroid`, which is the JavaScript
     * interface exposed by the Android WebView.
     *
     * Structured values remain structured within the TypeScript
     * layer. They are serialized only when crossing the WebView
     * JavaScript interface boundary.
     */
    function createAndroidBridge() {
        return {
            /**
             * Forwards a viewer log message to Android.
             *
             * @param {string} message viewer log message
             */
            log(message) {
                window.DocxionAndroid?.log(
                    String(message)
                );
            },

            /**
             * Forwards a page-change event to Android.
             *
             * @param {number} page current page
             * @param {number} totalPages total number of pages
             */
            onPageChanged(page, totalPages) {
                window.DocxionAndroid?.onPageChanged(
                    Number(page),
                    Number(totalPages)
                );
            },

            /**
             * Forwards a zoom-change event to Android.
             *
             * @param {number} zoom current zoom level
             */
            onZoomChanged(zoom) {
                window.DocxionAndroid?.onZoomChanged(
                    Number(zoom)
                );
            },

            /**
             * Forwards the viewer's text selection to Android.
             *
             * `selection` is the TextSelection interface exposed by
             * the TypeScript viewer. The shell does not extract text
             * or reconstruct selection geometry.
             *
             * The value is serialized here because the Android
             * WebView JavaScript interface receives the structured
             * selection as a JSON string.
             *
             * @param {TextSelection|null} selection current selection,
             * or null when there is no active selection
             */
            onTextSelected(selection) {
                window.DocxionAndroid?.onTextSelected(
                    selection == null
                        ? null
                        : JSON.stringify(selection)
                );
            },

            /**
             * Forwards the viewer-ready event to Android.
             *
             * @param {number} timestamp viewer-ready timestamp
             */
            onReady(timestamp) {
                window.DocxionAndroid?.onReady(
                    Number(timestamp)
                );
            },

            /**
             * Forwards a viewer error to Android.
             *
             * @param {string} message error message
             * @param {string|null} code optional error code
             */
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

    /**
     * Mounts the Docxion TypeScript viewer into the host container.
     *
     * This function is part of the shell lifecycle. It creates the
     * binding between the host container, the TypeScript viewer and
     * the Android callback adapter.
     *
     * @param {File|string|undefined} file initial document
     * @param {'light'|'dark'} theme initial viewer theme
     * @returns {Promise<boolean>} true when mounting succeeds
     */
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

        log(
            `Viewport: ` +
            `inner=${window.innerWidth}x${window.innerHeight}, ` +
            `document=${document.documentElement.clientWidth}x${document.documentElement.clientHeight}, ` +
            `body=${document.body.clientWidth}x${document.body.clientHeight}, ` +
            `viewer=${viewerContainer.clientWidth}x${viewerContainer.clientHeight}, ` +
            `rect=${viewerContainer.getBoundingClientRect().width}x${viewerContainer.getBoundingClientRect().height}`
        );

        log(
            `Computed body: ` +
            `display=${getComputedStyle(document.body).display}, ` +
            `position=${getComputedStyle(document.body).position}, ` +
            `width=${getComputedStyle(document.body).width}, ` +
            `height=${getComputedStyle(document.body).height}`
        );

        log(
            `Computed viewer: ` +
            `display=${getComputedStyle(viewerContainer).display}, ` +
            `position=${getComputedStyle(viewerContainer).position}, ` +
            `width=${getComputedStyle(viewerContainer).width}, ` +
            `height=${getComputedStyle(viewerContainer).height}`
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

        log(
            `Docxion children: ${viewerContainer.children.length}`
        );

        log(
            `Docxion HTML: ${viewerContainer.innerHTML}`
        );

        for (const child of viewerContainer.children) {
            log(
                `Docxion child: ` +
                `${child.tagName} ${child.className}, ` +
                `width=${child.clientWidth}, ` +
                `height=${child.clientHeight}, ` +
                `computedWidth=${getComputedStyle(child).width}, ` +
                `computedHeight=${getComputedStyle(child).height}`
            );
        }

        logDebug(
            `Mounted: ${viewerContainer.clientWidth}x${viewerContainer.clientHeight}, ` +
            `children=${viewerContainer.children.length}, ` +
            `ready=${viewer.isReady()}`
        );

        return true;
    }

    /**
     * Public JavaScript API consumed by the Android WebView API.
     *
     * This object is the shell's Android-facing facade. Each
     * operation delegates to the corresponding ViewerAPI operation
     * exposed by the mounted TypeScript viewer.
     */
    window.docxionApi = {

        /**
         * Opens a document.
         */
        openFile(file) {
            return requireViewer().openFile(file);
        },

        /**
         * Closes the current document.
         */
        closeFile() {
            requireViewer().closeFile();
        },

        /**
         * Returns the current document.
         */
        getCurrentFile() {
            return requireViewer().getCurrentFile();
        },

        /**
         * Navigates to a page.
         */
        goToPage(page) {
            return requireViewer().goToPage(page);
        },

        /**
         * Returns the current page.
         */
        getCurrentPage() {
            return requireViewer().getCurrentPage();
        },

        /**
         * Returns the total number of pages.
         */
        getTotalPages() {
            return requireViewer().getTotalPages();
        },

        /**
         * Sets the viewer zoom.
         */
        setZoom(zoom) {
            return requireViewer().setZoom(zoom);
        },

        /**
         * Returns the current zoom.
         */
        getZoom() {
            return requireViewer().getZoom();
        },

        /**
         * Increases the viewer zoom.
         */
        zoomIn(step) {
            return requireViewer().zoomIn(step);
        },

        /**
         * Decreases the viewer zoom.
         */
        zoomOut(step) {
            return requireViewer().zoomOut(step);
        },

        /**
         * Fits the document to the available width.
         */
        fitToWidth() {
            return requireViewer().fitToWidth();
        },

        /**
         * Fits the document to the available page.
         */
        fitToPage() {
            return requireViewer().fitToPage();
        },

        /**
         * Searches the current document.
         */
        search(query) {
            return requireViewer().search(query);
        },

        /**
         * Clears the current search results.
         */
        clearSearch() {
            requireViewer().clearSearch();
        },

        /**
         * Navigates to the next search match.
         */
        goToNextMatch() {
            requireViewer().goToNextMatch();
        },

        /**
         * Navigates to the previous search match.
         */
        goToPreviousMatch() {
            requireViewer().goToPreviousMatch();
        },

        /**
         * Returns the selected text.
         */
        getSelectedText() {
            return requireViewer().getSelectedText();
        },

        /**
         * Clears the current text selection.
         */
        clearSelection() {
            requireViewer().clearSelection();
        },

        /**
         * Sets the viewer theme.
         */
        setTheme(theme) {
            requireViewer().setTheme(theme);
        },

        /**
         * Returns the current viewer theme.
         */
        getTheme() {
            return requireViewer().getTheme();
        },

        /**
         * Prints the current document.
         */
        print() {
            return requireViewer().print();
        },

        /**
         * Destroys the mounted viewer.
         */
        destroy() {
            if (!viewer) {
                return;
            }

            viewer.destroy();

            viewer = null;

            viewerContainer.replaceChildren();
        },

        /**
         * Returns whether the TypeScript viewer is currently mounted
         * and ready.
         */
        isReady() {
            return (
                viewer !== null &&
                viewer.isReady()
            );
        }
    };

    /**
     * Mounts the viewer when the host shell is initialized.
     *
     * Errors are forwarded to Android through the same bridge used
     * for normal viewer errors.
     */
    mount()
        .catch(error => {
            const message =
                String(
                    error?.message ?? error
                );

            reportError(
                message,
                'MOUNT_ERROR'
            );

            debug.textContent =
                'MOUNT ERROR: ' +
                message;
        });

    /**
     * Indicates that the host shell has been loaded.
     */
    window.DocxionHostReady = true;
})();