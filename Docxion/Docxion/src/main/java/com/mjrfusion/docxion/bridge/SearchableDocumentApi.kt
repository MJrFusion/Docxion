package com.mjrfusion.docxion.bridge

/**
 * Capability API for documents that support text search.
 */
interface SearchableDocumentApi {

    /**
     * Searches the current document.
     *
     * @param query search query.
     * @param callback receives the JSON-encoded search results.
     */
    fun search(
        query: String,
        callback: (String) -> Unit
    )

    /** Clears the current search results. */
    fun clearSearch()

    /** Navigates to the next search match. */
    fun goToNextMatch()

    /** Navigates to the previous search match. */
    fun goToPreviousMatch()
}
