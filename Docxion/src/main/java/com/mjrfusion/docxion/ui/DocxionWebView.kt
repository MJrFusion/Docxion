package com.mjrfusion.docxion.ui

import android.annotation.SuppressLint
import android.content.Context
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import com.mjrfusion.docxion.bridge.DocxionJsBridge
import com.mjrfusion.docxion.bridge.impl.DocxionJsBridgeImpl
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.client.DocxionFilePathHandler
import com.mjrfusion.docxion.client.DocxionWebViewClient
import timber.log.Timber
import java.io.File

/**
 * WebView container for the Docxion JavaScript viewer.
 *
 * Configures the WebView, exposes the Android callback bridge to
 * JavaScript, and provides access to bundled Docxion assets and
 * registered local document files.
 *
 * The public Kotlin viewer operations are provided separately by
 * [com.mjrfusion.docxion.bridge.DocxionWebViewApi].
 */
@SuppressLint("SetJavaScriptEnabled")
class DocxionWebView(
    context: Context
) : WebView(context) {

    private var bridge: DocxionJsBridge? = null

    private val filePathHandler =
        DocxionFilePathHandler()

    private val assetLoader =
        WebViewAssetLoader.Builder()
            .addPathHandler(
                "/assets/",
                WebViewAssetLoader.AssetsPathHandler(context)
            )
            .addPathHandler(
                "/docxion-file/",
                filePathHandler
            )
            .build()

    private val temporaryFiles =
        mutableSetOf<File>()

    init {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            builtInZoomControls = false
            displayZoomControls = false
        }

        webViewClient =
            DocxionWebViewClient(assetLoader)
    }

    /**
     * Logs WebView size changes for debugging.
     */
    override fun onSizeChanged(
        w: Int,
        h: Int,
        oldw: Int,
        oldh: Int
    ) {
        super.onSizeChanged(
            w,
            h,
            oldw,
            oldh
        )

        Timber.d(
            "WebView size: ${w}x${h}"
        )
    }

    /**
     * Installs the Android callback bridge exposed to JavaScript as
     * `window.DocxionAndroid`.
     *
     * Replaces any previously installed bridge.
     *
     * @param callbacks callback implementation receiving viewer events
     */
    fun setCallbacks(
        callbacks: DocxionCallbacks
    ) {
        bridge?.let {
            removeJavascriptInterface(
                "DocxionAndroid"
            )
        }

        bridge =
            DocxionJsBridgeImpl(callbacks)

        addJavascriptInterface(
            bridge!!,
            "DocxionAndroid"
        )
    }

    /**
     * Registers a local document for access by the JavaScript viewer.
     *
     * @param filePath absolute filesystem path
     * @return token used to construct the document resource URL
     */
    fun registerFile(
        filePath: String
    ): String {
        return filePathHandler.register(
            filePath
        )
    }

    /**
     * Loads the bundled Docxion HTML application.
     */
    fun loadDocxion() {
        loadUrl(
            "https://appassets.androidplatform.net/assets/docxion/index.html"
        )
    }

    /**
     * Stops and destroys the Docxion WebView.
     *
     * Removes the JavaScript bridge, clears registered files,
     * deletes tracked temporary files, and destroys the WebView.
     */
    fun destroyDocxion() {
        bridge = null

        removeJavascriptInterface(
            "DocxionAndroid"
        )

        stopLoading()

        loadUrl("about:blank")

        clearHistory()
        removeAllViews()

        temporaryFiles.forEach(File::delete)
        temporaryFiles.clear()

        filePathHandler.clear()

        destroy()
    }
}