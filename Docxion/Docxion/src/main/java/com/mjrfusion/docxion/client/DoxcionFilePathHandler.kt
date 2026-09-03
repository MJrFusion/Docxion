package com.mjrfusion.docxion.client

import android.webkit.MimeTypeMap
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.File

/**
 * Exposes local filesystem files through [WebViewAssetLoader].
 *
 * Registered files are accessed through the `/docxion-file/` path and
 * are identified by a generated token.
 */
class DocxionFilePathHandler : WebViewAssetLoader.PathHandler {

    private val files = mutableMapOf<String, String>()

    /**
     * Registers a local file for WebView access.
     *
     * @param filePath absolute filesystem path
     * @return token used as the WebView resource path
     */
    @Synchronized
    fun register(filePath: String): String {
        val file = File(filePath)

        require(file.isAbsolute) {
            "Docxion file path must be absolute: $filePath"
        }

        require(file.isFile) {
            "Docxion file does not exist: $filePath"
        }

        val token = filePath.hashCode().toString()

        files[token] = file.absolutePath

        return token
    }

    /**
     * Serves a registered file to the WebView.
     *
     * @param path registered file token
     * @return WebView response for the file, or null when the token is
     * unknown or the file no longer exists
     */
    @Synchronized
    override fun handle(
        path: String
    ): WebResourceResponse? {
        val filePath = files[path] ?: return null
        val file = File(filePath)

        if (!file.isFile) {
            files.remove(path)
            return null
        }

        val mimeType = MimeTypeMap.getSingleton()
            .getMimeTypeFromExtension(file.extension.lowercase())
            ?: "application/octet-stream"

        return WebResourceResponse(
            mimeType,
            null,
            file.inputStream()
        )
    }

    /**
     * Unregisters a previously registered file.
     *
     * @param filePath absolute filesystem path to unregister
     */
    @Synchronized
    fun unregister(
        filePath: String
    ) {
        files.entries
            .removeIf { it.value == filePath }
    }

    /**
     * Removes all registered files.
     */
    @Synchronized
    fun clear() {
        files.clear()
    }
}