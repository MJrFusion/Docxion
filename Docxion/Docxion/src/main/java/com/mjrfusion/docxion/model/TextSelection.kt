package com.mjrfusion.docxion.model

/**
 * Represents the geometry of a text selection emitted by the
 * Docxion JavaScript viewer.
 *
 * A selection may contain multiple rectangles when it spans
 * multiple lines.
 *
 * @param rects selection rectangles in JavaScript viewport coordinates
 */
data class TextSelection(
    val rects: List<SelectionRect>
)

/**
 * Represents one rectangular region occupied by a text selection.
 *
 * @param left left coordinate
 * @param top top coordinate
 * @param right right coordinate
 * @param bottom bottom coordinate
 */
data class SelectionRect(
    val left: Double,
    val top: Double,
    val right: Double,
    val bottom: Double
)