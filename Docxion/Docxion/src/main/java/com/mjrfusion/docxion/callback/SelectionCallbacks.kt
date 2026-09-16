package com.mjrfusion.docxion.callback

import com.mjrfusion.docxion.model.TextSelection

/**
 * Capability callback interface for documents that support text selection.
 *
 * This is relevant for formats whose content can be selected by the user, such as
 * Word documents, PowerPoint presentations, and Excel spreadsheets.
 *
 * Implement this interface alongside [DocxionCallbacks] when the host application
 * needs to react to text selection changes:
 *
 * ```kotlin
 * class MyCallbacks : DocxionCallbacks, SelectionCallbacks {
 *     override fun onTextSelected(selection: TextSelection?) {
 *         // Show a toolbar, copy to clipboard, etc.
 *     }
 * }
 * ```
 */
interface SelectionCallbacks {

    /**
     * Called when the current text selection changes.
     *
     * @param selection the newly selected text range, or `null` if the selection
     *                  was cleared.
     */
    fun onTextSelected(
        selection: TextSelection?
    )
}