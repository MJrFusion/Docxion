package com.mjrfusion.docxion.bridge

import android.net.Uri

/**
 * Base Kotlin API for controlling the Docxion viewer.
 *
 * This interface contains only operations shared by all supported
 * document types: opening, closing, zooming, theming, capturing,
 * printing, and viewer lifecycle.
 *
 * Document-specific operations are exposed through separate capability
 * interfaces:
 * [PaginatedDocumentApi], [SearchableDocumentApi], and
 * [SelectableDocumentApi].
 *
 * Documents can be opened from either an Android [Uri] or an
 * absolute filesystem path.
 */
interface DocxionWebViewApi {

    /**
     * Returns a snapshot of the capabilities of the currently loaded
     * document.
     *
     * Before a document is loaded, this returns [DocumentCapabilities.None].
     *
     * @param callback receives the current capability snapshot.
     */
    fun getDocumentCapabilities(
        callback: (DocumentCapabilities) -> Unit
    )

    /**
     * Opens a document from an Android content [Uri].
     *
     * @param uri Android content URI of the document.
     */
    fun openFile(uri: Uri)

    /**
     * Opens a document from an absolute filesystem path.
     *
     * @param file absolute filesystem path of the document.
     */
    fun openFile(file: String)

    /**
     * Closes the currently opened document.
     */
    fun closeFile()

    /**
     * Returns the current document.
     *
     * @param callback receives the document value as a string, or null
     * if no document is open.
     */
    fun getCurrentFile(callback: (String?) -> Unit)

    /**
     * Sets the viewer zoom level.
     *
     * @param zoom zoom level.
     */
    fun setZoom(zoom: Double)

    /**
     * Returns the current zoom level.
     *
     * @param callback receives the current zoom level.
     */
    fun getZoom(callback: (Double) -> Unit)

    /**
     * Increases the viewer zoom level.
     *
     * @param step optional zoom increment.
     */
    fun zoomIn(step: Double? = null)

    /**
     * Decreases the viewer zoom level.
     *
     * @param step optional zoom decrement.
     */
    fun zoomOut(step: Double? = null)

    /**
     * Fits the document to the available viewer width.
     */
    fun fitToWidth()

    /**
     * Fits the document to the available viewer page.
     */
    fun fitToPage()

    /**
     * Sets the viewer theme.
     *
     * @param theme theme to apply to the viewer.
     */
    fun setTheme(theme: Theme)

    /**
     * Returns the current viewer theme.
     *
     * @param callback receives the current viewer theme.
     */
    fun getTheme(callback: (Theme) -> Unit)

    /**
     * Captures the rendered viewer at the requested dimensions.
     *
     * The returned data contains the captured viewer as a PNG image.
     *
     * @param width output width in pixels.
     * @param height output height in pixels.
     * @param callback receives the captured PNG data.
     */
    fun capture(
        width: Int,
        height: Int,
        callback: (ByteArray) -> Unit
    )

    /**
     * Captures the rendered viewer using the specified output height.
     *
     * The output width is inferred from the viewer's current width.
     *
     * @param height output height in pixels.
     * @param callback receives the captured PNG data.
     */
    fun capture(
        height: Int,
        callback: (ByteArray) -> Unit
    )

    /**
     * Captures the rendered viewer using the specified aspect ratio.
     *
     * The output width is inferred from the viewer's current width,
     * and the output height is calculated from [aspectRatio].
     *
     * @param aspectRatio aspect ratio to use for the capture.
     * @param callback receives the captured PNG data.
     */
    fun capture(
        aspectRatio: CaptureAspectRatio,
        callback: (ByteArray) -> Unit
    )

    /**
     * Prints the current document.
     */
    fun print()

    /**
     * Destroys the JavaScript viewer and releases associated resources.
     */
    fun destroy()

    /**
     * Returns whether the viewer is ready.
     *
     * @param callback receives true when the viewer is ready.
     */
    fun isReady(callback: (Boolean) -> Unit)
}
