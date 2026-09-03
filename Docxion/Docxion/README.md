# Docxion Android Library

> **Project Status: Early Development**
>
> Docxion is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

Docxion is the Android/Jetpack Compose wrapper around the TypeScript/JavaScript viewer that powers the document UI. The Android side hosts the viewer in a `WebView` and exposes the Kotlin control surface through `DocxionWebViewApi`.

The current bridge flow is:

```text
Kotlin -> WebView -> window.docxionApi -> TypeScript ViewerAPI
```

The JavaScript side reports events back to Android through:

```text
JavaScript -> window.DocxionAndroid -> Android callbacks
```

---

## Table of Contents

- [Docxion Android Library](#docxion-android-library)
  - [Table of Contents](#table-of-contents)
  - [Current Status](#current-status)
  - [Installation](#installation)
  - [Basic Setup](#basic-setup)
  - [Opening Documents](#opening-documents)
    - [Open a content `Uri`](#open-a-content-uri)
    - [Open an absolute filesystem path](#open-an-absolute-filesystem-path)
  - [Viewer Callbacks](#viewer-callbacks)
  - [Basic API Usage](#basic-api-usage)
  - [Build and Development](#build-and-development)
    - [1. Build the TypeScript viewer](#1-build-the-typescript-viewer)
    - [2. Prepare the Android assets](#2-prepare-the-android-assets)
    - [3. Build the Android library](#3-build-the-android-library)
    - [Automated Build](#automated-build)
  - [Relationship to the TypeScript Viewer](#relationship-to-the-typescript-viewer)
  - [Requirements and Limitations](#requirements-and-limitations)
  - [Example](#example)
  - [License](#license)

---

## Current Status

This library is functional enough for the example app in this repository, but it is still early-stage. Public APIs, packaging, and internal structure may change.

---

## Installation

The library can currently be consumed as the `Docxion` module of this repository's Gradle project.

From another Android project in the same Gradle settings file, add:

```gradle
implementation project(':Docxion')
```

The module namespace is:

```text
com.mjrfusion.docxion
```

A published dependency will be provided in the future.

---

## Basic Setup

Use the `DocxionViewer` composable to host the viewer:

```kotlin
val callbacks = object : DocxionCallbacks {

    override fun log(message: String) {}

    override fun onPageChanged(page: Int, totalPages: Int) {}

    override fun onZoomChanged(zoom: Double) {}

    override fun onTextSelected(selection: TextSelection?) {}

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

`onApiCreated` provides the `DocxionWebViewApi` when the viewer API becomes available.

The viewer JavaScript is loaded separately inside the WebView. The API can therefore be created before the JavaScript viewer reports that it is ready.

For operations that require the mounted viewer, use the `onReady` callback to know when the viewer is ready.

---

## Opening Documents

The Android API currently exposes the JavaScript viewer API through `DocxionWebViewApi`.

### Open a content `Uri`

`openFile(uri: Uri)` copies the content into the app cache before handing it to the viewer.

```kotlin
api?.openFile(selectedUri)
```

This is useful when a document comes from Android's document picker or another content provider.

The temporary cached copy is managed by the library and removed when the viewer is destroyed.

### Open an absolute filesystem path

`openFile(file: String)` requires an absolute path to an existing file.

```kotlin
api?.openFile("/absolute/path/to/document.docx")
```

The Android WebView cannot directly expose an arbitrary local filesystem path to the JavaScript viewer. Docxion therefore registers the file with its WebView file handler and exposes it to the viewer through the local WebView asset URL.

---

## Viewer Callbacks

Provide a `DocxionCallbacks` implementation to receive events from the JavaScript viewer:

- `log(message)`
- `onPageChanged(page, totalPages)`
- `onZoomChanged(zoom)`
- `onTextSelected(selection)`
- `onReady(timestamp)`
- `onError(message, code)`

These callbacks are delivered through:

```text
window.DocxionAndroid
```

inside the `WebView`.

For example:

```kotlin
val callbacks = object : DocxionCallbacks {

    override fun log(message: String) {
        Log.d("Docxion", message)
    }

    override fun onPageChanged(page: Int, totalPages: Int) {
        Log.d("Docxion", "Page: $page / $totalPages")
    }

    override fun onZoomChanged(zoom: Double) {
        Log.d("Docxion", "Zoom: $zoom")
    }

    override fun onTextSelected(selection: TextSelection?) {
        Log.d("Docxion", "Selection: $selection")
    }

    override fun onReady(timestamp: Long) {
        Log.d("Docxion", "Viewer ready: $timestamp")
    }

    override fun onError(message: String, code: String?) {
        Log.e("Docxion", "Error: $message, code: $code")
    }
}
```

---

## Basic API Usage

`DocxionWebViewApi` mirrors the current TypeScript `ViewerAPI` surface used by the viewer shell.

The main operations available today are:

- `openFile(uri: Uri)`
- `openFile(file: String)`
- `closeFile()`
- `getCurrentFile(callback)`
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

Example:

```kotlin
api?.goToPage(2)

api?.zoomIn()

api?.fitToWidth()

api?.setTheme("dark")
```

Methods that return values from JavaScript use callbacks because the values are returned asynchronously from `WebView.evaluateJavascript()`.

For example:

```kotlin
api?.getCurrentPage { page ->
    Log.d("Docxion", "Current page: $page")
}
```

Search results are returned as the JSON string produced by the JavaScript viewer layer. The TypeScript viewer remains the source of truth for the search result format.

---

## Build and Development

The Android library contains the Android WebView wrapper and a small native shell, while the document viewer distribution is produced by the TypeScript project.

The normal preparation flow is:

```text
office-viewer
     |
     | npm install
     | npm run build
     v
dist/
     |
     | copy built distribution
     v
Docxion/src/main/assets/docxion/
     |
     +-- existing Android shell
     |     index.html
     |     index.css
     |     index.js
     |
     +-- copied viewer distribution
           vendor/
           index.umd.js
           ...
     |
     v
Build Docxion Android Library
```

### 1. Build the TypeScript viewer

From the `office-viewer` directory, install the dependencies and build the viewer:

```bash
npm install
npm run build
```

This produces the viewer distribution under:

```text
office-viewer/dist/
```

The TypeScript viewer must be fully built and packaged before its generated assets can be used by the Android library.

### 2. Prepare the Android assets

The Android library does **not** contain the generated viewer distribution by default.

The Android assets directory contains the native WebView shell files separately:

```text
Docxion/src/main/assets/docxion/
├── index.html
├── index.css
└── index.js
```

These shell files are part of the Android integration and should be kept in the library.

After successfully building `office-viewer`, copy the generated contents of:

```text
office-viewer/dist/
```

into:

```text
Docxion/src/main/assets/docxion/
```

Do **not** replace the existing Android shell files unless the corresponding shell implementation is intentionally being updated.

The resulting assets directory should contain the Android shell together with the generated viewer distribution, for example:

```text
Docxion/src/main/assets/docxion/
│
├── index.html
├── index.css
├── index.js
├── index.umd.js
├── vendor/
└── ...
```

The exact generated files depend on the current `office-viewer` build.

In other words, the setup is currently a two-part assembly:

```text
Android shell
    +
TypeScript viewer distribution
    =
Docxion WebView assets
```

Once the TypeScript viewer has been completely built and its generated distribution has been copied into the Android library assets alongside the existing shell, the Android library is ready to be built.

### 3. Build the Android library

After the viewer distribution has been prepared, build the Android library from the repository root:

```bash
./gradlew :Docxion:build
```

The resulting Android library can then be used by the `Example` application or another Android project.

### Automated Build

The viewer-to-Android asset preparation is currently manual.

In the future, an automation script will handle the complete preparation flow:

```text
npm install
      |
      v
npm run build
      |
      v
copy viewer distribution
      |
      v
prepare Docxion Android assets
      |
      v
Gradle build
```

Until that automation is provided, users who want to build the library from source need to complete the TypeScript viewer's npm build/package step first and then copy the generated distribution into the Android library's assets directory.

No additional manual modification of the Android WebView shell is required when using the existing shell files.

---

## Relationship to the TypeScript Viewer

The Android wrapper does not reimplement document rendering.

It hosts the TypeScript viewer in a `WebView`, loads the bundled viewer assets, and forwards commands to:

```text
window.docxionApi
```

Android callbacks travel in the opposite direction through:

```text
window.DocxionAndroid
```

The overall relationship is:

```text
office-viewer
      |
      | npm run build
      v
TypeScript/JavaScript distribution
      |
      | copied into Android assets
      v
Docxion WebView
      |
      +----------------------+
      |                      |
      v                      v
window.docxionApi     window.DocxionAndroid
      |                      |
      v                      v
Kotlin API             Android callbacks
```

The Android WebView shell provides the integration layer between the bundled JavaScript viewer and the native Android bridge.

This keeps document rendering and viewer behavior in the TypeScript/JavaScript layer while the Android library provides the native WebView and Jetpack Compose integration.

---

## Requirements and Limitations

- The API validates that absolute file paths exist before opening them.
- `openFile(Uri)` creates a temporary cached copy for the viewer.
- The wrapper expects to run inside `DocxionWebView`; the API is created from that WebView instance.
- The TypeScript viewer must be fully built and packaged before its generated assets can be copied into the Android library.
- The generated `office-viewer/dist/` contents are not included in the Android library by default.
- The existing Android WebView shell (`index.html`, `index.css`, and `index.js`) is maintained separately from the generated viewer distribution.
- The current viewer-to-Android asset preparation workflow is manual.
- Automated build and asset-copy scripts are planned but are not currently provided.
- This project is still early-stage and behavior may change.

---

## Example

See the practical Android integration in:

[../Example/README.md](../Example/README.md)

The example application demonstrates how to embed `DocxionViewer`, receive the `DocxionWebViewApi`, provide callbacks, and interact with the viewer from Jetpack Compose.

---

## License

Copyright 2026 MJrFusion

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.

You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,

WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and
limitations under the License.
