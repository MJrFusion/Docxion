package com.mjrfusion.docxion.bridge

/**
 * Capability API for documents that support text selection.
 */
interface SelectableDocumentApi {

    /**
     * Returns the currently selected text.
     *
     * @param callback receives the selected text, or null when there is
     *                 no active selection.
     */
    fun getSelectedText(callback: (String?) -> Unit)

    /** Clears the current text selection. */
    fun clearSelection()
}
