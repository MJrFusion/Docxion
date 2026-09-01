package com.mjrfusion.docxion.bridge

import android.content.Context
import android.net.Uri
import android.webkit.WebView
import com.mjrfusion.docxion.ui.DocxionWebView
import org.json.JSONObject
import timber.log.Timber
import java.io.File

class DocxionWebViewApi(
    private val webView: WebView
) {

    private var temporaryFile: File? = null

    fun openFile(uri: Uri) {
        val context = webView.context

        val fileName = getFileName(context, uri) ?: "document"
        val file = File(context.cacheDir, "docxion_$fileName")

        context.contentResolver.openInputStream(uri)?.use { input ->
            file.outputStream().use { output ->
                input.copyTo(output)
            }
        } ?: throw IllegalArgumentException("Unable to read URI: $uri")

        temporaryFile?.delete()
        temporaryFile = file

        openFile(file.absolutePath)
    }

    fun openFile(file: String) {
        val path = File(file)

        require(path.isAbsolute) {
            "Docxion openFile(String) requires an absolute file path: $file"
        }

        require(path.isFile) {
            "Docxion file does not exist: $file"
        }

        val docxionWebView = webView as? DocxionWebView
            ?: error("DocxionWebViewApi requires a DocxionWebView")

        val token = docxionWebView.registerFile(path.absolutePath)

        val fileUrl =
            "https://appassets.androidplatform.net/docxion-file/$token"

        val encodedUrl = JSONObject.quote(fileUrl)
        val encodedFileName = JSONObject.quote(path.name)

        evaluate(
            $$"""
        (async () => {
            try {
                console.log("Docxion: fetching file", $$encodedUrl);

                const response = await fetch($$encodedUrl);

                console.log(
                    "Docxion: fetch response",
                    response.status,
                    response.statusText,
                    response.headers.get("content-type")
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch document: ${response.status} ${response.statusText}`
                    );
                }

                const blob = await response.blob();

                console.log(
                    "Docxion: blob",
                    blob.size,
                    blob.type
                );

                const documentFile = new File(
                    [blob],
                    $$encodedFileName,
                    {
                        type: blob.type || 'application/octet-stream'
                    }
                );

                console.log(
                    "Docxion: opening file",
                    documentFile.name,
                    documentFile.size,
                    documentFile.type
                );

                await window.docxionApi.openFile(documentFile);

                console.log("Docxion: openFile completed");

            } catch (error) {
                console.error(
                    "Docxion: openFile failed",
                    error
                );

                window.DocxionAndroid?.onError(
                    String(error?.message ?? error),
                    "OPEN_FILE_ERROR"
                );
            }
        })();
        """.trimIndent()
        )
    }

    fun closeFile() {
        evaluate(
            """
            window.docxionApi.closeFile();
        """.trimIndent()
        )
    }

    fun getCurrentFile(callback: (String?) -> Unit) {
        evaluate(
            """
            window.docxionApi.getCurrentFile();
        """.trimIndent()
        ) { result ->
            callback(parseString(result))
        }
    }

    fun goToPage(page: Int) {
        evaluate(
            """
            window.docxionApi.goToPage($page);
        """.trimIndent()
        )
    }

    fun getCurrentPage(callback: (Int) -> Unit) {
        evaluate(
            """
            window.docxionApi.getCurrentPage();
        """.trimIndent()
        ) { result ->
            result
                ?.removeSurrounding("\"")
                ?.toIntOrNull()
                ?.let(callback)
        }
    }

    fun getTotalPages(callback: (Int) -> Unit) {
        evaluate(
            """
            window.docxionApi.getTotalPages();
        """.trimIndent()
        ) { result ->
            result
                ?.removeSurrounding("\"")
                ?.toIntOrNull()
                ?.let(callback)
        }
    }

    fun setZoom(zoom: Double) {
        evaluate(
            """
            window.docxionApi.setZoom($zoom);
        """.trimIndent()
        )
    }

    fun getZoom(callback: (Double) -> Unit) {
        evaluate(
            """
            window.docxionApi.getZoom();
        """.trimIndent()
        ) { result ->
            result
                ?.removeSurrounding("\"")
                ?.toDoubleOrNull()
                ?.let(callback)
        }
    }

    fun zoomIn(step: Double? = null) {
        val argument = step?.toString() ?: ""
        evaluate(
            """
            window.docxionApi.zoomIn($argument);
        """.trimIndent()
        )
    }

    fun zoomOut(step: Double? = null) {
        val argument = step?.toString() ?: ""
        evaluate(
            """
            window.docxionApi.zoomOut($argument);
        """.trimIndent()
        )
    }

    fun fitToWidth() {
        evaluate(
            """
            window.docxionApi.fitToWidth();
        """.trimIndent()
        )
    }

    fun fitToPage() {
        evaluate(
            """
            window.docxionApi.fitToPage();
        """.trimIndent()
        )
    }

    fun search(query: String, callback: (String) -> Unit) {
        val encodedQuery = JSONObject.quote(query)

        evaluate(
            """
            window.docxionApi.search($encodedQuery);
        """.trimIndent()
        ) { result ->
            callback(result ?: "[]")
        }
    }

    fun clearSearch() {
        evaluate(
            """
            window.docxionApi.clearSearch();
        """.trimIndent()
        )
    }

    fun goToNextMatch() {
        evaluate(
            """
            window.docxionApi.goToNextMatch();
        """.trimIndent()
        )
    }

    fun goToPreviousMatch() {
        evaluate(
            """
            window.docxionApi.goToPreviousMatch();
        """.trimIndent()
        )
    }

    fun getSelectedText(callback: (String?) -> Unit) {
        evaluate(
            """
            window.docxionApi.getSelectedText();
        """.trimIndent()
        ) { result ->
            callback(parseString(result))
        }
    }

    fun clearSelection() {
        evaluate(
            """
            window.docxionApi.clearSelection();
        """.trimIndent()
        )
    }

    fun setTheme(theme: String) {
        require(theme == "light" || theme == "dark")

        val encodedTheme = JSONObject.quote(theme)

        evaluate(
            """
            window.docxionApi.setTheme($encodedTheme);
        """.trimIndent()
        )
    }

    fun getTheme(callback: (String) -> Unit) {
        evaluate(
            """
            window.docxionApi.getTheme();
        """.trimIndent()
        ) { result ->
            parseString(result)?.let(callback)
        }
    }

    fun print() {
        evaluate(
            """
            window.docxionApi.print();
        """.trimIndent()
        )
    }

    fun destroy() {
        evaluate(
            """
            window.docxionApi.destroy();
        """.trimIndent()
        )

        temporaryFile?.delete()
        temporaryFile = null
    }

    fun isReady(callback: (Boolean) -> Unit) {
        evaluate(
            """
            window.docxionApi.isReady();
        """.trimIndent()
        ) { result ->
            when (result) {
                "true" -> callback(true)
                "false" -> callback(false)
            }
        }
    }

    private fun getFileName(
        context: Context,
        uri: Uri
    ): String? {
        context.contentResolver
            .query(
                uri,
                arrayOf("_display_name"),
                null,
                null,
                null
            )
            ?.use { cursor ->
                if (cursor.moveToFirst()) {
                    return cursor.getString(0)
                }
            }

        return uri.lastPathSegment
    }

    private fun evaluate(
        script: String,
        callback: ((String?) -> Unit)? = null
    ) {
        Timber.d("JS <- %s", script)

        webView.post {
            webView.evaluateJavascript(script) { result ->
                Timber.d("JS -> %s", result)
                callback?.invoke(result)
            }
        }
    }

    private fun parseString(value: String?): String? {
        if (value == null || value == "null") {
            return null
        }

        return try {
            JSONObject("""{"value":$value}""")
                .optString("value", "")
        } catch (_: Throwable) {
            value.removeSurrounding("\"")
        }
    }
}
