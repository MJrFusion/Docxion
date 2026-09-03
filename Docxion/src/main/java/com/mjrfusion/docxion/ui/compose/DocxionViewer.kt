package com.mjrfusion.docxion.ui.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.mjrfusion.docxion.bridge.DocxionWebViewApi
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.ui.DocxionWebView

/**
 * Composable Docxion document viewer.
 *
 * Creates and hosts a [DocxionWebView] and optionally connects Android
 * callbacks and the Kotlin viewer API.
 *
 * @param modifier modifier applied to the underlying WebView
 * @param callbacks optional callbacks for events emitted by the
 * JavaScript viewer
 * @param onApiCreated called when the [DocxionWebViewApi] is created
 */
@Composable
fun DocxionViewer(
    modifier: Modifier = Modifier,
    callbacks: DocxionCallbacks? = null,
    onApiCreated: (DocxionWebViewApi) -> Unit = {}
) {
    val currentCallbacks =
        rememberUpdatedState(callbacks)

    val currentOnApiCreated =
        rememberUpdatedState(onApiCreated)

    AndroidView(
        modifier = modifier,

        factory = { context ->
            DocxionWebView(context).apply {
                currentCallbacks.value?.let(::setCallbacks)
                currentOnApiCreated.value(webApi)

                loadDocxion()
            }
        }
    )
}