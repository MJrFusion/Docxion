package com.mjrfusion.docxion.ui.compose

import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.mjrfusion.docxion.bridge.DocxionWebViewApi
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.ui.DocxionWebView

@Composable
fun DocxionViewer(
    modifier: Modifier = Modifier,
    callbacks: DocxionCallbacks? = null,
    onApiCreated: (DocxionWebViewApi) -> Unit = {}
) {
    val currentCallbacks = rememberUpdatedState(callbacks)
    val currentOnApiCreated = rememberUpdatedState(onApiCreated)

    AndroidView(
        modifier = modifier,

        factory = { context ->
            DocxionWebView(context).apply {
                currentCallbacks.value?.let(::setCallbacks)

                loadDocxion()

                currentOnApiCreated.value(
                    DocxionWebViewApi(this)
                )
            }
        }
    )
}
