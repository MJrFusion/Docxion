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
     * Opens an Android-registered document.
     *
     * The Android host registers the local file with the WebView asset loader
     * and passes the resulting asset URL and original file name to this
     * function. The document is fetched, converted into a browser [File],
     * and then passed to the underlying viewer API.
     *
     * This function is an Android/WebView bridge helper and is not part of
     * the public [ViewerAPI].
     *
     * @param {string} fileUrl URL of the document registered by Android
     * @param {string} fileName original document file name
     * @returns {Promise<void>} resolves when the document has been opened
     */
    async function openAndroidFile(fileUrl, fileName) {
        try {
            const response = await fetch(fileUrl);

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch document: ${response.status} ${response.statusText}`
                );
            }

            const blob = await response.blob();

            const file = new File(
                [blob],
                fileName,
                {
                    type: blob.type || 'application/octet-stream',
                }
            );

            await requireViewer().openFile(file);
        } catch (error) {
            console.error(
                'Docxion: openFile failed',
                error
            );

            window.DocxionAndroid?.onError(
                String(error?.message ?? error),
                'OPEN_FILE_ERROR'
            );
        }
    }

    /**
     * DOM element hosting the Docxion viewer.
     */
    const viewerContainer = document.getElementById('viewer');

    /**
     * Forwards a log message to Android.
     *
     * The host shell does not use the browser console for logging.
     *
     * @param {unknown} message message to log
     */
    function log(message) {
        window.DocxionAndroid?.log(String(message));
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
            code == null ? null : String(code)
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

    window.addEventListener('resize', updateViewportHeight);

    /**
     * Returns the currently mounted viewer.
     *
     * @throws {Error} if the viewer has not been mounted
     */
    function requireViewer() {
        if (!viewer) {
            throw new Error('Docxion viewer is not initialized.');
        }

        return viewer;
    }

    /**
     * Returns the public Docxion runtime types.
     *
     * These are exposed by the TypeScript bundle under
     * `window.Docxion.types`.
     *
     * @throws {Error} if the runtime types are not available
     */
    function requireTypes() {
        if (!window.Docxion?.types) {
            throw new Error('Docxion runtime types are not available.');
        }

        return window.Docxion.types;
    }

    /**
     * Converts a Uint8Array into a Base64 string.
     *
     * The conversion is performed entirely inside JavaScript so that
     * the Android-facing API only has to transport a string through
     * the WebView JavaScript bridge.
     *
     * The conversion is performed in chunks to avoid exceeding the
     * JavaScript argument limit of String.fromCharCode().
     *
     * @param {Uint8Array} bytes binary data
     * @returns {string} Base64 encoded data
     */
    function uint8ArrayToBase64(bytes) {
        let binary = '';

        const chunkSize = 0x8000;

        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            const chunk = bytes.subarray(
                offset,
                Math.min(offset + chunkSize, bytes.length)
            );

            binary += String.fromCharCode(...chunk);
        }

        return btoa(binary);
    }

    /**
    * Captures the rendered viewer as a PNG and optionally invokes a callback
    * with the resulting image encoded as a Base64 string.
    *
    * The second parameter can either be the capture height or the callback.
    * When a callback is provided as the second parameter, the height is
    * considered undefined and the viewer determines the capture dimensions
    * according to the underlying capture API.
    *
    * Supported forms:
    * * `capture(width, height, callback)`
    * * `capture(height, callback)`
    * * `capture(aspectRatio, callback)`
    * * `capture(width, height)`
    * * `capture(height)`
    * * `capture(aspectRatio)`
    *
    * @param {number|string} value
    * Width, height, or aspect ratio passed to the underlying viewer capture API.
    *
    * @param {number|Function|undefined} heightOrCallback
    * Capture height.
    *
    * @returns {Promise<string>}
    * A Promise resolving to the captured PNG encoded as a Base64 string.
    */
    async function capture(value, height = undefined) {
        try {
            const data = await requireViewer().capture(value, height);
            const base64 = uint8ArrayToBase64(data);

            window.DocxionCapture.onCapture(base64);

            return base64;
        } catch (error) {
            console.error(error);
            window.DocxionCapture.onError(
                String(error?.message ?? error)
            );
        }
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
                window.DocxionAndroid?.log(String(message));
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
                window.DocxionAndroid?.onZoomChanged(Number(zoom));
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
                window.DocxionAndroid?.onReady(Number(timestamp));
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
                    code == null ? null : String(code)
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
     * @param {string} theme initial viewer theme
     * @returns {Promise<boolean>} true when mounting succeeds
     */
    async function mount(file = undefined, theme = undefined) {
        if (!window.Docxion ||
            typeof window.Docxion.mountViewer !== 'function') {
            throw new Error('Docxion.mountViewer() is not available.');
        }

        const types = requireTypes();

        if (viewer) {
            viewer.destroy();
            viewer = null;
        }

        viewerContainer.replaceChildren();

        const initialTheme = theme ?? types.Theme.LIGHT;

        viewer = await window.Docxion.mountViewer(
            viewerContainer,
            {
                file,
                theme: initialTheme,
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
                androidBridge: createAndroidBridge()
            }
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
        openAndroidFile(fileUrl, fileName) {
            return openAndroidFile(
                fileUrl,
                fileName
            );
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
         *
         * @param {string} theme value from `Docxion.types.Theme`
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
         * Captures the rendered viewer at the requested dimensions.
         *
         * Supported overloads:
         *
         *     capture(width, height)
         *     capture(height)
         *     capture(aspectRatio)
         *
         * The underlying ViewerAPI returns Uint8Array data.
         * The host shell converts that data to Base64 so the Android
         * WebView API can receive it through evaluateJavascript().
         *
         * @param {number|string} widthOrHeightOrAspectRatio
         * width, height, or a value from
         * `Docxion.types.CaptureAspectRatio`
         *
         * @param {number|undefined} height output height
         *
         * @returns {Promise<string>} Base64 encoded PNG data
         */
        capture(widthOrHeightOrAspectRatio, height = undefined) {
            return capture(
                widthOrHeightOrAspectRatio,
                height
            );
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
            return viewer !== null && viewer.isReady();
        }
    };

    /**
     * Mounts the viewer when the host shell is initialized.
     *
     * Errors are forwarded to Android through the same bridge used
     * for normal viewer errors.
     */
    mount().catch(error => {
        const message = String(error?.message ?? error);
        reportError(message, 'MOUNT_ERROR');
    });

    /**
     * Indicates that the host shell has been loaded.
     */
    window.DocxionHostReady = true;
})();