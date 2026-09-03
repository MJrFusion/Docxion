package com.mjrfusion.docxion.example

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
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
import com.mjrfusion.docxion.bridge.DocxionWebViewApi
import com.mjrfusion.docxion.callback.DocxionCallbacks
import com.mjrfusion.docxion.example.ui.theme.ExampleTheme
import com.mjrfusion.docxion.model.TextSelection
import com.mjrfusion.docxion.ui.compose.DocxionViewer

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            ExampleTheme {
                DocxionExampleScreen()
            }
        }
    }
}

@Composable
private fun DocxionExampleScreen() {
    var api by remember { mutableStateOf<DocxionWebViewApi?>(null) }

    val callbacks = remember {
        object : DocxionCallbacks {

            override fun log(message: String) {
                Log.d("Docxion", message)
            }

            override fun onPageChanged(page: Int, totalPages: Int) {
                Log.d(
                    "Docxion",
                    "Page changed: $page / $totalPages"
                )
            }

            override fun onZoomChanged(zoom: Double) {
                Log.d(
                    "Docxion",
                    "Zoom changed: $zoom"
                )
            }

            override fun onTextSelected(selection: TextSelection?) {
                Log.d(
                    "Docxion",
                    "Text selection: $selection"
                )
            }

            override fun onReady(timestamp: Long) {
                Log.d(
                    "Docxion",
                    "Ready: $timestamp"
                )
            }

            override fun onError(message: String, code: String?) {
                Log.e(
                    "Docxion",
                    "Error: $message, code=$code"
                )
            }
        }
    }

    val filePicker = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        uri?.let {
            Log.d("Docxion", "Opening file: $it")
            api?.openFile(it)
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            DocxionViewer(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                callbacks = callbacks,
                onApiCreated = {
                    Log.d("Docxion", "API created")
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
                }
            )
        }
    }
}

@Composable
private fun Controls(
    api: DocxionWebViewApi?,
    onOpenFile: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(scrollState),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Button(
                enabled = api != null,
                onClick = onOpenFile
            ) {
                Text("Open")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Close file")
                    api?.closeFile()
                }
            ) {
                Text("Close")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Go to page 1")
                    api?.goToPage(1)
                }
            ) {
                Text("Page 1")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Go to next page")
                    api?.getCurrentPage { page ->
                        Log.d("Docxion", "Current page: $page")
                        api.goToPage(page + 1)
                    }
                }
            ) {
                Text("Next page")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Zoom out")
                    api?.zoomOut()
                }
            ) {
                Text("−")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Zoom in")
                    api?.zoomIn()
                }
            ) {
                Text("+")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Fit to width")
                    api?.fitToWidth()
                }
            ) {
                Text("Fit width")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Fit to page")
                    api?.fitToPage()
                }
            ) {
                Text("Fit page")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Previous match")
                    api?.goToPreviousMatch()
                }
            ) {
                Text("Previous match")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Next match")
                    api?.goToNextMatch()
                }
            ) {
                Text("Next match")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Clear search")
                    api?.clearSearch()
                }
            ) {
                Text("Clear search")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Clear selection")
                    api?.clearSelection()
                }
            ) {
                Text("Clear selection")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Set light theme")
                    api?.setTheme("light")
                }
            ) {
                Text("Light")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Set dark theme")
                    api?.setTheme("dark")
                }
            ) {
                Text("Dark")
            }

            OutlinedButton(
                enabled = api != null,
                onClick = {
                    Log.d("Docxion", "Print")
                    api?.print()
                }
            ) {
                Text("Print")
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun DocxionExamplePreview() {
    ExampleTheme {
        Controls(
            api = null,
            onOpenFile = {}
        )
    }
}