package com.mjrfusion.docxion.bridge

import android.webkit.JavascriptInterface

/**
 * JavaScript-to-Android callback bridge exposed as
 * `window.DocxionAndroid`.
 *
 * JavaScript uses this interface to report viewer events and
 * errors back to the Android host.
 */
interface DocxionJsBridge {

    /**
     * Reports a debug log message from JavaScript.
     *
     * @param message message to log
     */
    @JavascriptInterface
    fun log(message: String)

    /**
     * Reports that the current page changed.
     *
     * @param page current page number
     * @param totalPages total number of pages
     */
    @JavascriptInterface
    fun onPageChanged(
        page: Int,
        totalPages: Int
    )

    /**
     * Reports that the viewer zoom level changed.
     *
     * @param zoom current zoom level
     */
    @JavascriptInterface
    fun onZoomChanged(
        zoom: Double
    )

    /**
     * Reports that the selected text changed.
     *
     * @param text selected text, or null when there is no selection
     */
    @JavascriptInterface
    fun onTextSelected(
        text: String?
    )

    /**
     * Reports that the viewer is ready.
     *
     * @param timestamp JavaScript timestamp indicating when the viewer became ready
     */
    @JavascriptInterface
    fun onReady(
        timestamp: Long
    )

    /**
     * Reports an error from the JavaScript viewer.
     *
     * @param message error message
     * @param code optional error code
     */
    @JavascriptInterface
    fun onError(
        message: String,
        code: String?
    )
}