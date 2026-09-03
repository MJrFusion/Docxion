package com.mjrfusion.docxion.callback

import com.mjrfusion.docxion.model.TextSelection

/**
 * Receives events emitted by the Docxion JavaScript viewer.
 *
 * This interface mirrors the TypeScript `AndroidCallbacks` contract.
 */
interface DocxionCallbacks {

    /**
     * Receives a debug log message from the JavaScript viewer.
     *
     * @param message log message
     */
    fun log(
        message: String
    )

    /**
     * Called when the current page changes.
     *
     * @param page current page number
     * @param totalPages total number of pages
     */
    fun onPageChanged(
        page: Int,
        totalPages: Int
    )

    /**
     * Called when the viewer zoom level changes.
     *
     * @param zoom current zoom level
     */
    fun onZoomChanged(
        zoom: Double
    )

    /**
     * Called when the text selection changes.
     *
     * @param selection current selection geometry, or null when there is
     * no active selection
     */
    fun onTextSelected(
        selection: TextSelection?
    )

    /**
     * Called when the viewer becomes ready.
     *
     * @param timestamp JavaScript timestamp indicating when the viewer became ready
     */
    fun onReady(
        timestamp: Long
    )

    /**
     * Called when an error occurs in the JavaScript viewer.
     *
     * @param message error message
     * @param code optional error code
     */
    fun onError(
        message: String,
        code: String?
    )
}