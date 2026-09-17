package com.mjrfusion.docxion.bridge.impl

import android.webkit.JavascriptInterface
import com.mjrfusion.docxion.bridge.internal.DocxionJsBridge
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.callback.PaginationCallbacks
import com.mjrfusion.docxion.callback.SelectionCallbacks
import com.mjrfusion.docxion.model.SelectionRect
import com.mjrfusion.docxion.model.TextSelection
import org.json.JSONObject

/**
 * Default [DocxionJsBridge] implementation that forwards JavaScript
 * events to the supplied [DocxionCallbacks] instance.
 *
 * The `@JavascriptInterface` method signatures are kept stable so the
 * JavaScript side requires no changes. Internally, capability-specific
 * events are dispatched only when the callback object also implements
 * the corresponding capability interface ([PaginationCallbacks],
 * [SelectionCallbacks]); otherwise the event is silently ignored.
 *
 * @param callbacks the callback object supplied by the host application.
 */
internal class DocxionJsBridgeImpl(
    private val callbacks: DocxionCallbacks
) : DocxionJsBridge {

    @JavascriptInterface
    override fun log(message: String) {
        callbacks.log(message)
    }

    @JavascriptInterface
    override fun onPageChanged(page: Int, totalPages: Int) {
        (callbacks as? PaginationCallbacks)
            ?.onPageChanged(page, totalPages)
    }

    @JavascriptInterface
    override fun onZoomChanged(zoom: Double) {
        callbacks.onZoomChanged(zoom)
    }

    @JavascriptInterface
    override fun onTextSelected(selectionJson: String?) {
        val selection = selectionJson?.let(::parseTextSelection)
        (callbacks as? SelectionCallbacks)
            ?.onTextSelected(selection)
    }

    @JavascriptInterface
    override fun onReady(timestamp: Long) {
        callbacks.onReady(timestamp)
    }

    @JavascriptInterface
    override fun onError(message: String, code: String?) {
        callbacks.onError(message, code)
    }

    /**
     * Parses the JSON payload emitted by the JavaScript viewer into a
     * [TextSelection].
     *
     * @param json the raw JSON string describing the selection.
     * @return the parsed [TextSelection].
     */
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