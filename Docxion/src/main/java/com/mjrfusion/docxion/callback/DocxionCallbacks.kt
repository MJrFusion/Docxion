package com.mjrfusion.docxion.callback

interface DocxionCallbacks {

    fun log(
        message: String
    )

    fun onPageChanged(
        page: Int,
        totalPages: Int
    )

    fun onZoomChanged(
        zoom: Double
    )

    fun onTextSelected(
        text: String?
    )

    fun onReady(
        timestamp: Long
    )

    fun onError(
        message: String,
        code: String?
    )
}
