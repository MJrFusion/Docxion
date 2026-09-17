package com.mjrfusion.docxion.bridge

/**
 * Capabilities of the currently loaded document.
 *
 * Obtained from [DocxionWebViewApi.getDocumentCapabilities] after a
 * document has been opened. The set reflects the format of the loaded
 * document, not the viewer's static abilities.
 *
 * @property isPaginated true when the document supports page-based
 * navigation via [PaginatedDocumentApi].
 * @property isSearchable true when the document supports text search
 * via [SearchableDocumentApi].
 * @property isSelectable true when the document supports text
 * selection via [SelectableDocumentApi].
 */
data class DocumentCapabilities(
    val isPaginated: Boolean,
    val isSearchable: Boolean,
    val isSelectable: Boolean
) {
    companion object {

        /**
         * Capabilities reported when no document is loaded.
         */
        val None = DocumentCapabilities(
            isPaginated = false,
            isSearchable = false,
            isSelectable = false
        )

        /**
         * Resolves the capabilities of a document from its file name.
         *
         * The file name may be a full absolute path or a bare name;
         * only the substring after the last `.` is examined. Matching
         * is case-insensitive.
         *
         * Unknown or missing extensions report [None].
         *
         * @param fileName file name or absolute path of the document.
         * @return the capability snapshot for the given file name.
         */
        fun fromFileName(
            fileName: String
        ): DocumentCapabilities {
            val extension = fileName
                .substringAfterLast('.', "")
                .lowercase()

            return when (extension) {
                "doc", "docx", "pptx", "ppt" -> DocumentCapabilities(
                    isPaginated = true,
                    isSearchable = true,
                    isSelectable = true
                )

                "xls", "xlsx" -> DocumentCapabilities(
                    isPaginated = false,
                    isSearchable = true,
                    isSelectable = true
                )

                else -> None
            }
        }
    }
}