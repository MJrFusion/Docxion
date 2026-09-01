# Docxion Android Library

> Project Status: Early Development
>
> Docxion is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

Docxion is the Android/Jetpack Compose wrapper around the TypeScript/JavaScript viewer that powers the document UI. The Android side hosts the viewer in a `WebView` and exposes the Kotlin control surface through `DocxionWebViewApi`.

The current bridge flow is:

`Kotlin -> WebView -> window.docxionApi -> TypeScript ViewerAPI`

The JavaScript side reports events back to Android through:

`JavaScript -> window.DocxionAndroid -> Android callbacks`

## Current Status

This library is functional enough for the example app in this repository, but it is still early-stage. Public APIs, packaging, and internal structure may change.

## Installation

This repository currently uses the Android library as a local Gradle module. From another Android project in the same settings file, add:

```gradle
implementation project(':Docxion')
```

The module namespace is `com.mjrfusion.docxion`.

## Basic Setup

Use the `DocxionViewer` composable to host the viewer:

```kotlin
val callbacks = object : DocxionCallbacks {
    override fun log(message: String) {}

    override fun onPageChanged(page: Int, totalPages: Int) {}

    override fun onZoomChanged(zoom: Double) {}

    override fun onTextSelected(text: String?) {}

    override fun onReady(timestamp: Long) {}

    override fun onError(message: String, code: String?) {}
}

var api by remember { mutableStateOf<DocxionWebViewApi?>(null) }

DocxionViewer(
    modifier = Modifier.fillMaxSize(),
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

`onApiCreated` receives the `DocxionWebViewApi` instance as soon as the `WebView` is created.

## Opening Documents

The Android API currently exposes the JavaScript viewer API through `DocxionWebViewApi`.

### Open a content `Uri`

`openFile(uri: Uri)` copies the content into the app cache before handing it to the viewer.

```kotlin
api?.openFile(selectedUri)
```

### Open an absolute filesystem path

`openFile(file: String)` requires an absolute path to an existing file.

```kotlin
api?.openFile("/absolute/path/to/document.pdf")
```

## Viewer Callbacks

Provide a `DocxionCallbacks` implementation to receive events from the JavaScript viewer:

- `log(message)`
- `onPageChanged(page, totalPages)`
- `onZoomChanged(zoom)`
- `onTextSelected(text)`
- `onReady(timestamp)`
- `onError(message, code)`

These callbacks are delivered through `window.DocxionAndroid` inside the `WebView`.

## Basic API Usage

`DocxionWebViewApi` mirrors the current TypeScript `ViewerAPI` surface used by the viewer shell. The main operations available today are:

- `openFile(uri: Uri)`
- `openFile(file: String)`
- `closeFile()`
- `goToPage(page: Int)`
- `getCurrentPage(callback)`
- `getTotalPages(callback)`
- `setZoom(zoom: Double)`
- `getZoom(callback)`
- `zoomIn(step: Double? = null)`
- `zoomOut(step: Double? = null)`
- `fitToWidth()`
- `fitToPage()`
- `search(query, callback)`
- `clearSearch()`
- `goToNextMatch()`
- `goToPreviousMatch()`
- `getSelectedText(callback)`
- `clearSelection()`
- `setTheme(theme)`
- `getTheme(callback)`
- `print()`
- `destroy()`
- `isReady(callback)`

Search results are returned as the JSON string produced by the JavaScript viewer layer, and the viewer currently treats the underlying TypeScript viewer as the source of truth.

## Relationship to the TypeScript Viewer

The Android wrapper does not reimplement document rendering. It hosts the TypeScript viewer in a `WebView`, loads the bundled viewer assets, and forwards commands to `window.docxionApi`.

Android callbacks travel in the opposite direction through `window.DocxionAndroid`.

## Requirements and Limitations

- The API validates that absolute file paths exist before opening them.
- `openFile(Uri)` creates a temporary cached copy for the viewer.
- The wrapper expects to run inside `DocxionWebView`; the API is created from that WebView instance.
- This project is still early-stage and behavior may change.

## Example

See the practical integration in [../Example/README.md](../Example/README.md).

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](../LICENSE) file for details.
