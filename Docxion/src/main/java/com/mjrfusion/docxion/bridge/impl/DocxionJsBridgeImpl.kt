package com.mjrfusion.docxion.bridge.impl

import android.webkit.JavascriptInterface
import com.mjrfusion.docxion.bridge.DocxionJsBridge
import com.mjrfusion.docxion.callback.DocxionCallbacks

internal class DocxionJsBridgeImpl(
    private val callbacks: DocxionCallbacks
) : DocxionJsBridge {

    @JavascriptInterface
    override fun log(message: String) {
        callbacks.log(message)
    }

    @JavascriptInterface
    override fun onPageChanged(page: Int, totalPages: Int) {
        callbacks.onPageChanged(page, totalPages)
    }

    @JavascriptInterface
    override fun onZoomChanged(zoom: Double) {
        callbacks.onZoomChanged(zoom)
    }

    @JavascriptInterface
    override fun onTextSelected(text: String?) {
        callbacks.onTextSelected(text)
    }

    @JavascriptInterface
    override fun onReady(timestamp: Long) {
        callbacks.onReady(timestamp)
    }

    @JavascriptInterface
    override fun onError(message: String, code: String?) {
        callbacks.onError(message, code)
    }
}