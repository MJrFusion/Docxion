package com.mjrfusion.docxion.bridge

import android.net.Uri

/**
 * Supported viewer themes.
 */
enum class Theme(
    val value: String
) {
    /** Light viewer theme. */
    LIGHT("light"),

    /** Dark viewer theme. */
    DARK("dark")
}

/**
 * Supported aspect ratios for viewer captures.
 *
 * The ratio determines the output dimensions when capturing the
 * rendered viewer without explicitly specifying both width and height.
 */
enum class CaptureAspectRatio(
    val value: String
) {
    /** Square output with a 1:1 aspect ratio. */
    RATIO_1_1("1:1"),

    /** Landscape output with a 16:9 aspect ratio. */
    RATIO_16_9("16:9"),

    /** Portrait output with a 9:16 aspect ratio. */
    RATIO_9_16("9:16"),

    /** Landscape output with a 4:3 aspect ratio. */
    RATIO_4_3("4:3"),

    /** Portrait output with a 3:4 aspect ratio. */
    RATIO_3_4("3:4"),

    /** Landscape output with a 3:2 aspect ratio. */
    RATIO_3_2("3:2")
}

/**
 * Kotlin API for controlling the Docxion viewer.
 *
 * This interface mirrors the public TypeScript `ViewerAPI`.
 *
 * Documents can be opened from either an Android [Uri] or an
 * absolute filesystem path.
 */
interface DocxionWebViewApi {

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
     * Navigates to a page.
     *
     * @param page page number to navigate to.
     */
    fun goToPage(page: Int)

    /**
     * Returns the current page number.
     *
     * @param callback receives the current page number.
     */
    fun getCurrentPage(callback: (Int) -> Unit)

    /**
     * Returns the total number of pages.
     *
     * @param callback receives the total page count.
     */
    fun getTotalPages(callback: (Int) -> Unit)

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
     * Searches the current document.
     *
     * @param query search query.
     * @param callback receives the JSON-encoded search results.
     */
    fun search(
        query: String,
        callback: (String) -> Unit
    )

    /**
     * Clears the current search results.
     */
    fun clearSearch()

    /**
     * Navigates to the next search match.
     */
    fun goToNextMatch()

    /**
     * Navigates to the previous search match.
     */
    fun goToPreviousMatch()

    /**
     * Returns the currently selected text.
     *
     * @param callback receives the selected text, or null if there is
     * no selection.
     */
    fun getSelectedText(callback: (String?) -> Unit)

    /**
     * Clears the current text selection.
     */
    fun clearSelection()

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