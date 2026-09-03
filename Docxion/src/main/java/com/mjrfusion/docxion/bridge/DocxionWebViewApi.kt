package com.mjrfusion.docxion.bridge

import android.net.Uri

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
     * @param uri Android content URI of the document
     */
    fun openFile(uri: Uri)

    /**
     * Opens a document from an absolute filesystem path.
     *
     * @param file absolute filesystem path of the document
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
     * if no document is open
     */
    fun getCurrentFile(callback: (String?) -> Unit)

    /**
     * Navigates to a page.
     *
     * @param page page number to navigate to
     */
    fun goToPage(page: Int)

    /**
     * Returns the current page number.
     *
     * @param callback receives the current page number
     */
    fun getCurrentPage(callback: (Int) -> Unit)

    /**
     * Returns the total number of pages.
     *
     * @param callback receives the total page count
     */
    fun getTotalPages(callback: (Int) -> Unit)

    /**
     * Sets the viewer zoom level.
     *
     * @param zoom zoom level
     */
    fun setZoom(zoom: Double)

    /**
     * Returns the current zoom level.
     *
     * @param callback receives the current zoom level
     */
    fun getZoom(callback: (Double) -> Unit)

    /**
     * Increases the viewer zoom level.
     *
     * @param step optional zoom increment
     */
    fun zoomIn(step: Double? = null)

    /**
     * Decreases the viewer zoom level.
     *
     * @param step optional zoom decrement
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
     * @param query search query
     * @param callback receives the JSON-encoded search results
     */
    fun search(query: String, callback: (String) -> Unit)

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
     * no selection
     */
    fun getSelectedText(callback: (String?) -> Unit)

    /**
     * Clears the current text selection.
     */
    fun clearSelection()

    /**
     * Sets the viewer theme.
     *
     * @param theme either `light` or `dark`
     */
    fun setTheme(theme: String)

    /**
     * Returns the current viewer theme.
     *
     * @param callback receives `light` or `dark`
     */
    fun getTheme(callback: (String) -> Unit)

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
     * @param callback receives true when the viewer is ready
     */
    fun isReady(callback: (Boolean) -> Unit)
}