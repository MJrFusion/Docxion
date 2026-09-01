package com.mjrfusion.docxion.bridge

import android.content.Context
import android.net.Uri
import android.webkit.WebView
import com.mjrfusion.docxion.ui.DocxionWebView
import org.json.JSONObject
import timber.log.Timber
import java.io.File

/**
 * Kotlin API for controlling the Docxion viewer running inside a [WebView].
 *
 * This class mirrors the public TypeScript `ViewerAPI` and forwards
 * operations to `window.docxionApi` through JavaScript evaluation.
 *
 * The API supports opening documents from either an Android [Uri] or
 * an absolute filesystem path.
 *
 * @param webView WebView hosting the Docxion viewer
 */
class DocxionWebViewApi(
    private val webView: WebView
) {

    private var temporaryFile: File? = null

    /**
     * Opens a document from an Android content [Uri].
     *
     * The URI contents are copied into the application's cache directory
     * before being exposed to the Docxion WebView.
     *
     * The temporary copy is deleted when another URI is opened or when
     * [destroy] is called.
     *
     * @param uri Android content URI of the document
     * @throws IllegalArgumentException if the URI cannot be read
     */
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

    /**
     * Opens a document from an absolute filesystem path.
     *
     * The local file is registered with [DocxionWebView] and exposed to
     * JavaScript through the WebView asset loader. JavaScript fetches the
     * file, creates a browser [File], and passes it to `window.docxionApi`.
     *
     * @param file absolute filesystem path of the document
     * @throws IllegalArgumentException if the path is not absolute or
     * the file does not exist
     */
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

    /**
     * Closes the currently opened document.
     */
    fun closeFile() {
        evaluate(
            """
            window.docxionApi.closeFile();
        """.trimIndent()
        )
    }

    /**
     * Returns the current document.
     *
     * @param callback receives the document value as a string, or null
     * if no document is open
     */
    fun getCurrentFile(
        callback: (String?) -> Unit
    ) {
        evaluate(
            """
            window.docxionApi.getCurrentFile();
        """.trimIndent()
        ) { result ->
            callback(parseString(result))
        }
    }

    /**
     * Navigates to a page.
     *
     * @param page page number to navigate to
     */
    fun goToPage(page: Int) {
        evaluate(
            """
            window.docxionApi.goToPage($page);
        """.trimIndent()
        )
    }

    /**
     * Returns the current page number.
     *
     * @param callback receives the current page number
     */
    fun getCurrentPage(
        callback: (Int) -> Unit
    ) {
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

    /**
     * Returns the total number of pages.
     *
     * @param callback receives the total page count
     */
    fun getTotalPages(
        callback: (Int) -> Unit
    ) {
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

    /**
     * Sets the viewer zoom level.
     *
     * @param zoom zoom level
     */
    fun setZoom(zoom: Double) {
        evaluate(
            """
            window.docxionApi.setZoom($zoom);
        """.trimIndent()
        )
    }

    /**
     * Returns the current zoom level.
     *
     * @param callback receives the current zoom level
     */
    fun getZoom(
        callback: (Double) -> Unit
    ) {
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

    /**
     * Increases the viewer zoom level.
     *
     * @param step optional zoom increment
     */
    fun zoomIn(step: Double? = null) {
        val argument = step?.toString() ?: ""

        evaluate(
            """
            window.docxionApi.zoomIn($argument);
        """.trimIndent()
        )
    }

    /**
     * Decreases the viewer zoom level.
     *
     * @param step optional zoom decrement
     */
    fun zoomOut(step: Double? = null) {
        val argument = step?.toString() ?: ""

        evaluate(
            """
            window.docxionApi.zoomOut($argument);
        """.trimIndent()
        )
    }

    /**
     * Fits the document to the available viewer width.
     */
    fun fitToWidth() {
        evaluate(
            """
            window.docxionApi.fitToWidth();
        """.trimIndent()
        )
    }

    /**
     * Fits the document to the available viewer page.
     */
    fun fitToPage() {
        evaluate(
            """
            window.docxionApi.fitToPage();
        """.trimIndent()
        )
    }

    /**
     * Searches the current document.
     *
     * @param query search query
     * @param callback receives the JSON-encoded search results
     */
    fun search(
        query: String,
        callback: (String) -> Unit
    ) {
        val encodedQuery = JSONObject.quote(query)

        evaluate(
            """
            window.docxionApi.search($encodedQuery);
        """.trimIndent()
        ) { result ->
            callback(result ?: "[]")
        }
    }

    /**
     * Clears the current search results.
     */
    fun clearSearch() {
        evaluate(
            """
            window.docxionApi.clearSearch();
        """.trimIndent()
        )
    }

    /**
     * Navigates to the next search match.
     */
    fun goToNextMatch() {
        evaluate(
            """
            window.docxionApi.goToNextMatch();
        """.trimIndent()
        )
    }

    /**
     * Navigates to the previous search match.
     */
    fun goToPreviousMatch() {
        evaluate(
            """
            window.docxionApi.goToPreviousMatch();
        """.trimIndent()
        )
    }

    /**
     * Returns the currently selected text.
     *
     * @param callback receives the selected text, or null if there is
     * no selection
     */
    fun getSelectedText(
        callback: (String?) -> Unit
    ) {
        evaluate(
            """
            window.docxionApi.getSelectedText();
        """.trimIndent()
        ) { result ->
            callback(parseString(result))
        }
    }

    /**
     * Clears the current text selection.
     */
    fun clearSelection() {
        evaluate(
            """
            window.docxionApi.clearSelection();
        """.trimIndent()
        )
    }

    /**
     * Sets the viewer theme.
     *
     * @param theme either `light` or `dark`
     */
    fun setTheme(theme: String) {
        require(theme == "light" || theme == "dark")

        val encodedTheme = JSONObject.quote(theme)

        evaluate(
            """
            window.docxionApi.setTheme($encodedTheme);
        """.trimIndent()
        )
    }

    /**
     * Returns the current viewer theme.
     *
     * @param callback receives `light` or `dark`
     */
    fun getTheme(
        callback: (String) -> Unit
    ) {
        evaluate(
            """
            window.docxionApi.getTheme();
        """.trimIndent()
        ) { result ->
            parseString(result)?.let(callback)
        }
    }

    /**
     * Prints the current document.
     */
    fun print() {
        evaluate(
            """
            window.docxionApi.print();
        """.trimIndent()
        )
    }

    /**
     * Destroys the JavaScript viewer and deletes any temporary URI file.
     */
    fun destroy() {
        evaluate(
            """
            window.docxionApi.destroy();
        """.trimIndent()
        )

        temporaryFile?.delete()
        temporaryFile = null
    }

    /**
     * Returns whether the viewer is ready.
     *
     * @param callback receives true when the viewer is ready
     */
    fun isReady(
        callback: (Boolean) -> Unit
    ) {
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

    /**
     * Resolves a display name for a content URI.
     */
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

    /**
     * Evaluates JavaScript on the WebView thread.
     */
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

    /**
     * Parses a JavaScript string result returned by [WebView.evaluateJavascript].
     */
    private fun parseString(
        value: String?
    ): String? {
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