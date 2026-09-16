package com.mjrfusion.docxion.callback

/**
 * Capability callback interface for documents that support pagination.
 *
 * This is relevant for paginated formats such as Word documents and PowerPoint
 * presentations, but does **not** apply to non-paginated formats such as Excel
 * spreadsheets.
 *
 * Implement this interface alongside [DocxionCallbacks] when the host application
 * needs to react to page changes:
 *
 * ```kotlin
 * class MyCallbacks : DocxionCallbacks, PaginationCallbacks {
 *     override fun onPageChanged(page: Int, totalPages: Int) {
 *         // Update UI, persist reading position, etc.
 *     }
 * }
 * ```
 */
interface PaginationCallbacks {

    /**
     * Called when the currently visible page changes.
     *
     * @param page the one-based index of the newly visible page.
     * @param totalPages the total number of pages in the document.
     */
    fun onPageChanged(
        page: Int,
        totalPages: Int
    )
}