package com.mjrfusion.docxion.bridge

/**
 * Capability API for documents that support pagination.
 *
 * Implemented by paginated formats such as Word documents and
 * PowerPoint presentations. Not implemented by non-paginated formats
 * such as Excel spreadsheets.
 */
interface PaginatedDocumentApi {

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
}