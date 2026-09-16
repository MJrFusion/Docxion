package com.mjrfusion.docxion.callback

/**
 * Base callback interface for the Docxion viewer.
 *
 * This interface contains only events that are common to **all** supported document types.
 * Document-specific or format-specific events should be defined in separate capability
 * interfaces (e.g. [PaginationCallbacks], [SelectionCallbacks]) and implemented
 * alongside this one when needed.
 *
 * Consumers are not required to implement any of these methods, as all of them have
 * default no-op implementations.
 *
 * ### Usage
 * ```kotlin
 * class MyCallbacks : DocxionCallbacks, PaginationCallbacks {
 *     override fun onReady(timestamp: Long) {
 *         Log.d("Docxion", "Viewer ready at $timestamp")
 *     }
 *
 *     override fun onPageChanged(page: Int, totalPages: Int) {
 *         Log.d("Docxion", "Page $page of $totalPages")
 *     }
 * }
 * ```
 */
interface DocxionCallbacks {

    /**
     * Called when the viewer emits a log message.
     *
     * Useful for debugging or surfacing internal viewer state to the host application.
     *
     * @param message the log message emitted by the viewer.
     */
    fun log(message: String) {}

    /**
     * Called once the document has been loaded and the viewer is ready for interaction.
     *
     * @param timestamp the time at which the viewer became ready, in milliseconds
     *                  since the Unix epoch.
     */
    fun onReady(timestamp: Long) {}

    /**
     * Called whenever the zoom level of the viewer changes.
     *
     * @param zoom the new zoom level. A value of `1.0` typically represents 100% zoom.
     */
    fun onZoomChanged(zoom: Double) {}

    /**
     * Called when the viewer encounters an error.
     *
     * @param message a human-readable description of the error.
     * @param code an optional machine-readable error code, or `null` if no code is available.
     */
    fun onError(
        message: String,
        code: String?
    ) {}
}