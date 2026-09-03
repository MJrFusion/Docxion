package com.mjrfusion.docxion.client

import android.os.Build
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import timber.log.Timber

/**
 * WebView client used by Docxion to serve bundled assets and local documents.
 *
 * Requests are delegated to [WebViewAssetLoader], while navigation to
 * external URLs is blocked.
 *
 * @param assetLoader asset loader used to resolve bundled and registered
 * local resources
 */
class DocxionWebViewClient(
    private val assetLoader: WebViewAssetLoader
) : WebViewClient() {

    /**
     * Resolves WebView requests through the configured asset loader.
     *
     * @return the loaded resource, or null when the asset loader cannot
     * resolve the request
     */
    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(request.url)
    }

    /**
     * Prevents navigation away from the Docxion WebView.
     *
     * @return true to block the navigation
     */
    override fun shouldOverrideUrlLoading(
        view: WebView,
        request: WebResourceRequest
    ): Boolean {
        Timber.d("Blocking external navigation: %s", request.url)
        return true
    }

    /**
     * Handles termination of the WebView renderer process.
     *
     * @return true to indicate that the renderer termination was handled
     */
    override fun onRenderProcessGone(
        view: WebView,
        detail: RenderProcessGoneDetail
    ): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Timber.e(
                "WebView render process gone. Reason: %s, Did crash: %s",
                if (detail.didCrash()) "Crash" else "System killed",
                detail.didCrash()
            )
        }

        return true
    }
}