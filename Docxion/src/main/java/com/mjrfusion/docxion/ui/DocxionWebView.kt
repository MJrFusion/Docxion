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

@SuppressLint("SetJavaScriptEnabled")
class DocxionWebView(context: Context) : WebView(context) {

    private var bridge: DocxionJsBridge? = null

    private val filePathHandler = DocxionFilePathHandler()

    private val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler(
            "/assets/",
            WebViewAssetLoader.AssetsPathHandler(context)
        )
        .addPathHandler(
            "/docxion-file/",
            filePathHandler
        )
        .build()

    private val temporaryFiles = mutableSetOf<File>()

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

        webViewClient = DocxionWebViewClient(assetLoader)
    }

    override fun onSizeChanged(
        w: Int,
        h: Int,
        oldw: Int,
        oldh: Int
    ) {
        super.onSizeChanged(w, h, oldw, oldh)

        Timber.d("WebView size: ${w}x${h}")
    }

    fun setCallbacks(callbacks: DocxionCallbacks) {
        bridge?.let {
            removeJavascriptInterface("DocxionAndroid")
        }

        bridge = DocxionJsBridgeImpl(callbacks)

        addJavascriptInterface(bridge!!, "DocxionAndroid")
    }

    fun registerFile(filePath: String): String {
        return filePathHandler.register(filePath)
    }

    fun addTemporaryFile(file: File) {
        temporaryFiles += file
    }

    fun removeTemporaryFile(file: File) {
        temporaryFiles.remove(file)
        file.delete()
    }

    fun loadDocxion() {
        loadUrl("https://appassets.androidplatform.net/assets/docxion/index.html")
    }

    fun destroyDocxion() {
        bridge = null

        removeJavascriptInterface("DocxionAndroid")

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