package com.mjrfusion.docxion.bridge.impl

import android.content.Context
import android.net.Uri
import android.util.Base64
import android.webkit.WebView
import com.mjrfusion.docxion.bridge.CaptureAspectRatio
import com.mjrfusion.docxion.bridge.DocxionWebViewApi
import com.mjrfusion.docxion.bridge.Theme
import com.mjrfusion.docxion.ui.DocxionWebView
import org.json.JSONObject
import timber.log.Timber
import java.io.File

/**
 * Internal implementation of [DocxionWebViewApi].
 *
 * This class controls the Docxion viewer running inside a [WebView]
 * and forwards operations to `window.docxionApi` through JavaScript
 * evaluation.
 *
 * The API supports opening documents from either an Android [Uri] or
 * an absolute filesystem path.
 *
 * @param webView WebView hosting the Docxion viewer
 */
internal class DocxionWebViewApiImpl(
    private val webView: WebView
) : DocxionWebViewApi {

    private var temporaryFile: File? = null

    /**
     * Opens a document from an Android content [Uri].
     *
     * The URI contents are copied into the application's cache directory
     * before being registered with the [DocxionWebView].
     *
     * The temporary copy is deleted when another URI is opened or when
     * [destroy] is called.
     *
     * @param uri Android content URI of the document
     * @throws IllegalArgumentException if the URI cannot be read
     */
    override fun openFile(uri: Uri) {
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
     * The file is registered with [DocxionWebView] and made available to
     * the JavaScript viewer through the WebView asset loader. The JavaScript
     * viewer fetches the registered file and opens it in the document viewer.
     *
     * @param file absolute filesystem path of the document
     * @throws IllegalArgumentException if the path is not absolute or
     * the file does not exist
     */
    override fun openFile(file: String) {
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
        window.docxionApi.openAndroidFile(
            $$encodedUrl,
            $$encodedFileName
        );
        """.trimIndent()
        )
    }

    /**
     * Closes the currently opened document.
     */
    override fun closeFile() {
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
    override fun getCurrentFile(
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
    override fun goToPage(page: Int) {
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
    override fun getCurrentPage(
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
    override fun getTotalPages(
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
    override fun setZoom(zoom: Double) {
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
    override fun getZoom(
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
    override fun zoomIn(step: Double?) {
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
    override fun zoomOut(step: Double?) {
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
    override fun fitToWidth() {
        evaluate(
            """
            window.docxionApi.fitToWidth();
            """.trimIndent()
        )
    }

    /**
     * Fits the document to the available viewer page.
     */
    override fun fitToPage() {
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
    override fun search(
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
    override fun clearSearch() {
        evaluate(
            """
            window.docxionApi.clearSearch();
            """.trimIndent()
        )
    }

    /**
     * Navigates to the next search match.
     */
    override fun goToNextMatch() {
        evaluate(
            """
            window.docxionApi.goToNextMatch();
            """.trimIndent()
        )
    }

    /**
     * Navigates to the previous search match.
     */
    override fun goToPreviousMatch() {
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
    override fun getSelectedText(
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
    override fun clearSelection() {
        evaluate(
            """
            window.docxionApi.clearSelection();
            """.trimIndent()
        )
    }

    /**
     * Sets the viewer theme.
     *
     * @param theme viewer theme
     */
    override fun setTheme(theme: Theme) {
        val encodedTheme = JSONObject.quote(theme.value)

        evaluate(
            """
            window.docxionApi.setTheme($encodedTheme);
            """.trimIndent()
        )
    }

    /**
     * Returns the current viewer theme.
     *
     * @param callback receives the current viewer theme
     */
    override fun getTheme(
        callback: (Theme) -> Unit
    ) {
        evaluate(
            """
            window.docxionApi.getTheme();
            """.trimIndent()
        ) { result ->
            parseString(result)
                ?.let(::parseTheme)
                ?.let(callback)
        }
    }

    /**
     * Captures the viewer using an explicit width and height.
     *
     * The JavaScript host converts the resulting [Uint8Array] to a
     * Base64 string for transport through [WebView.evaluateJavascript].
     * The Base64 payload is decoded back into a [ByteArray] here.
     *
     * @param width capture width in pixels
     * @param height capture height in pixels
     * @param callback receives the captured PNG bytes
     */
    override fun capture(
        width: Int,
        height: Int,
        callback: (ByteArray) -> Unit
    ) {
        require(width > 0) {
            "Capture width must be greater than zero."
        }

        require(height > 0) {
            "Capture height must be greater than zero."
        }

        evaluate(
            """
            window.docxionApi.capture($width, $height);
            """.trimIndent(),
            logResult = false
        ) { result ->
            parseBase64(result)?.let(callback)
        }
    }

    /**
     * Captures the viewer using the specified height.
     *
     * The capture width is determined by the JavaScript viewer from its
     * current container width.
     *
     * @param height capture height in pixels
     * @param callback receives the captured PNG bytes
     */
    override fun capture(
        height: Int,
        callback: (ByteArray) -> Unit
    ) {
        require(height > 0) {
            "Capture height must be greater than zero."
        }

        evaluate(
            """
            window.docxionApi.capture($height);
            """.trimIndent(),
            logResult = false
        ) { result ->
            parseBase64(result)?.let(callback)
        }
    }

    /**
     * Captures the viewer using a predefined aspect ratio.
     *
     * The JavaScript viewer determines the capture width from its
     * current container width and derives the capture height from
     * [aspectRatio].
     *
     * @param aspectRatio capture aspect ratio
     * @param callback receives the captured PNG bytes
     */
    override fun capture(
        aspectRatio: CaptureAspectRatio,
        callback: (ByteArray) -> Unit
    ) {
        val encodedAspectRatio =
            JSONObject.quote(aspectRatio.value)

        evaluate(
            $$"""
            window.docxionApi.capture($encodedAspectRatio);
            """.trimIndent(),
            logResult = false
        ) { result ->
            parseBase64(result)?.let(callback)
        }
    }

    /**
     * Prints the current document.
     */
    override fun print() {
        evaluate(
            """
            window.docxionApi.print();
            """.trimIndent()
        )
    }

    /**
     * Destroys the JavaScript viewer and deletes any temporary URI file.
     */
    override fun destroy() {
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
    override fun isReady(
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
     * Parses a viewer [Theme] returned by JavaScript.
     */
    private fun parseTheme(
        value: String
    ): Theme? {
        return Theme.entries.firstOrNull {
            it.value == value
        }
    }

    /**
     * Parses a Base64 string returned by [WebView.evaluateJavascript]
     * into the original binary data.
     */
    private fun parseBase64(
        value: String?
    ): ByteArray? {
        val base64 = parseString(value) ?: return null

        return try {
            Base64.decode(
                base64,
                Base64.DEFAULT
            )
        } catch (exception: IllegalArgumentException) {
            Timber.e(
                exception,
                "Failed to decode Docxion capture"
            )
            null
        }
    }

    /**
     * Evaluates JavaScript on the WebView thread.
     *
     * @param script JavaScript source to evaluate
     * @param logResult whether the JavaScript result should be logged
     * @param callback optional callback receiving the JavaScript result
     */
    private fun evaluate(
        script: String,
        logResult: Boolean = true,
        callback: ((String?) -> Unit)? = null
    ) {
        Timber.d("JS <- %s", script)

        webView.post {
            webView.evaluateJavascript(script) { result ->
                if (logResult) {
                    Timber.d("JS -> %s", result)
                }

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