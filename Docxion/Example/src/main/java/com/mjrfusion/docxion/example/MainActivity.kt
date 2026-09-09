package com.mjrfusion.docxion.example

import android.content.ContentValues
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.mjrfusion.docxion.bridge.CaptureAspectRatio
import com.mjrfusion.docxion.bridge.DocxionWebViewApi
import com.mjrfusion.docxion.bridge.Theme
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.example.ui.theme.ExampleTheme
import com.mjrfusion.docxion.model.TextSelection
import com.mjrfusion.docxion.ui.compose.DocxionViewer
import timber.log.Timber

class MainActivity : ComponentActivity() {

    @RequiresApi(Build.VERSION_CODES.Q)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            ExampleTheme {
                DocxionExampleScreen()
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun saveCaptureToDownloads(bytes: ByteArray, fileName: String) {
        val resolver = contentResolver
        Timber.d("Capture bytes: ${bytes.size}")

        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, fileName)
            put(MediaStore.Downloads.MIME_TYPE, "image/png")
            put(MediaStore.Downloads.RELATIVE_PATH, "Download/Docxion")
            put(MediaStore.Downloads.IS_PENDING, 1)
        }

        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("Unable to create download file")

        try {
            resolver.openOutputStream(uri)?.use { output ->
                output.write(bytes)
            } ?: throw IllegalStateException("Unable to open download file")

            val completedValues = ContentValues().apply {
                put(MediaStore.Downloads.IS_PENDING, 0)
            }

            resolver.update(uri, completedValues, null, null)
            Timber.d("Capture saved: $uri")
        } catch (exception: Exception) {
            resolver.delete(uri, null, null)
            throw exception
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    @Composable
    private fun DocxionExampleScreen() {
        var api by remember { mutableStateOf<DocxionWebViewApi?>(null) }

        val callbacks = remember {
            object : DocxionCallbacks {
                override fun log(message: String) {
                    Timber.d(message)
                }

                override fun onPageChanged(page: Int, totalPages: Int) {
                    Timber.d("Page changed: $page / $totalPages")
                }

                override fun onZoomChanged(zoom: Double) {
                    Timber.d("Zoom changed: $zoom")
                }

                override fun onTextSelected(selection: TextSelection?) {
                    Timber.d("Text selection: $selection")
                }

                override fun onReady(timestamp: Long) {
                    Timber.d("Ready: $timestamp")
                }

                override fun onError(message: String, code: String?) {
                    Timber.e("Error: $message, code=$code")
                }
            }
        }

        val filePicker = rememberLauncherForActivityResult(
            ActivityResultContracts.OpenDocument()
        ) { uri ->
            uri?.let {
                Timber.d("Opening file: $it")
                api?.openFile(it)
            }
        }

        Scaffold(modifier = Modifier.fillMaxSize()) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                DocxionViewer(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    callbacks = callbacks,
                    onApiCreated = {
                        Timber.d("API created")
                        api = it
                    }
                )

                Controls(
                    api = api,
                    onOpenFile = {
                        filePicker.launch(
                            arrayOf(
                                "application/pdf",
                                "application/msword",
                                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                "application/vnd.ms-powerpoint",
                                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                "application/vnd.ms-excel",
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            )
                        )
                    },
                    onSaveCapture = { bytes, fileName ->
                        try {
                            saveCaptureToDownloads(bytes, fileName)
                            Timber.d("Capture downloaded: $fileName")
                        } catch (exception: Exception) {
                            Timber.e(exception, "Failed to save capture")
                        }
                    }
                )
            }
        }
    }

    @Composable
    private fun Controls(
        api: DocxionWebViewApi?,
        onOpenFile: () -> Unit,
        onSaveCapture: (ByteArray, String) -> Unit
    ) {
        val scrollState = rememberScrollState()

        Column(modifier = Modifier.fillMaxWidth().padding(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(scrollState),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Button(enabled = api != null, onClick = onOpenFile) {
                    Text("Open")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Close file")
                    api?.closeFile()
                }) {
                    Text("Close")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Go to page 1")
                    api?.goToPage(1)
                }) {
                    Text("Page 1")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Go to next page")
                    api?.getCurrentPage { page ->
                        Timber.d("Current page: $page")
                        api.goToPage(page + 1)
                    }
                }) {
                    Text("Next page")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Zoom out")
                    api?.zoomOut()
                }) {
                    Text("−")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Zoom in")
                    api?.zoomIn()
                }) {
                    Text("+")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Fit to width")
                    api?.fitToWidth()
                }) {
                    Text("Fit width")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Fit to page")
                    api?.fitToPage()
                }) {
                    Text("Fit page")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Previous match")
                    api?.goToPreviousMatch()
                }) {
                    Text("Previous match")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Next match")
                    api?.goToNextMatch()
                }) {
                    Text("Next match")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Clear search")
                    api?.clearSearch()
                }) {
                    Text("Clear search")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Clear selection")
                    api?.clearSelection()
                }) {
                    Text("Clear selection")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Set light theme")
                    api?.setTheme(Theme.LIGHT)
                }) {
                    Text("Light")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Set dark theme")
                    api?.setTheme(Theme.DARK)
                }) {
                    Text("Dark")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 1080x1920")
                    api?.capture(1080, 1920) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_1080x1920.png")
                    }
                }) {
                    Text("Capture 1080×1920")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture height 1920")
                    api?.capture(1920) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_height_1920.png")
                    }
                }) {
                    Text("Capture H 1920")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 1:1")
                    api?.capture(CaptureAspectRatio.RATIO_1_1) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_1x1.png")
                    }
                }) {
                    Text("1:1")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 16:9")
                    api?.capture(CaptureAspectRatio.RATIO_16_9) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_16x9.png")
                    }
                }) {
                    Text("16:9")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 9:16")
                    api?.capture(CaptureAspectRatio.RATIO_9_16) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_9x16.png")
                    }
                }) {
                    Text("9:16")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 4:3")
                    api?.capture(CaptureAspectRatio.RATIO_4_3) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_4x3.png")
                    }
                }) {
                    Text("4:3")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 3:4")
                    api?.capture(CaptureAspectRatio.RATIO_3_4) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_3x4.png")
                    }
                }) {
                    Text("3:4")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Capture 3:2")
                    api?.capture(CaptureAspectRatio.RATIO_3_2) { bytes ->
                        onSaveCapture(bytes, "docxion_capture_3x2.png")
                    }
                }) {
                    Text("3:2")
                }

                OutlinedButton(enabled = api != null, onClick = {
                    Timber.d("Print")
                    api?.print()
                }) {
                    Text("Print")
                }
            }
        }
    }

    @Preview(showBackground = true)
    @Composable
    private fun DocxionExamplePreview() {
        ExampleTheme {
            Controls(api = null, onOpenFile = {}, onSaveCapture = { _, _ -> })
        }
    }
}