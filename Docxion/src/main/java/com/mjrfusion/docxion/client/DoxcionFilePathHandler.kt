package com.mjrfusion.docxion.client

import android.webkit.MimeTypeMap
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.File

class DocxionFilePathHandler : WebViewAssetLoader.PathHandler {

    private val files = mutableMapOf<String, String>()

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

    @Synchronized
    override fun handle(path: String): WebResourceResponse? {
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

    @Synchronized
    fun unregister(filePath: String) {
        files.entries
            .removeIf { it.value == filePath }
    }

    @Synchronized
    fun clear() {
        files.clear()
    }
}