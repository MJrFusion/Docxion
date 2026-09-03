package com.mjrfusion.docxion.bridge.impl

import android.webkit.JavascriptInterface
import com.mjrfusion.docxion.bridge.DocxionJsBridge
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.model.SelectionRect
import com.mjrfusion.docxion.model.TextSelection
import org.json.JSONObject

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
    override fun onTextSelected(selectionJson: String?) {
        val selection = selectionJson?.let(::parseTextSelection)
        callbacks.onTextSelected(selection)
    }

    @JavascriptInterface
    override fun onReady(timestamp: Long) {
        callbacks.onReady(timestamp)
    }

    @JavascriptInterface
    override fun onError(message: String, code: String?) {
        callbacks.onError(message, code)
    }

    private fun parseTextSelection(
        json: String
    ): TextSelection {
        val root = JSONObject(json)
        val jsonRects = root.getJSONArray("rects")
        val rects = buildList(jsonRects.length()) {
            for (index in 0 until jsonRects.length()) {
                val rect = jsonRects.getJSONObject(index)

                add(
                    SelectionRect(
                        left = rect.getDouble("left"),
                        top = rect.getDouble("top"),
                        right = rect.getDouble("right"),
                        bottom = rect.getDouble("bottom")
                    )
                )
            }
        }

        return TextSelection(rects)
    }
}