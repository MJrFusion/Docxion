package com.mjrfusion.docxion.bridge

import android.webkit.JavascriptInterface

interface DocxionJsBridge {

    @JavascriptInterface
    fun log(message: String)

    @JavascriptInterface
    fun onPageChanged(page: Int, totalPages: Int)

    @JavascriptInterface
    fun onZoomChanged(zoom: Double)

    @JavascriptInterface
    fun onTextSelected(text: String?)

    @JavascriptInterface
    fun onReady(timestamp: Long)

    @JavascriptInterface
    fun onError(message: String, code: String?)
}