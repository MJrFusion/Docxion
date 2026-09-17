package com.mjrfusion.docxion.bridge

/**
 * Capability API for documents that support page-based navigation.
 *
 * A document handle may implement this interface when the currently
 * loaded document supports pagination.
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
