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
    - [2. Copy the distribution into Android assets](#2-copy-the-distribution-into-android-assets)
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

This repository currently uses the Android library as a local Gradle module.

From another Android project in the same Gradle settings file, add:

```gradle
implementation project(':Docxion')
```

The module namespace is:

```text
com.mjrfusion.docxion
```

---

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
- `onTextSelected(text)`
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

    override fun onTextSelected(text: String?) {
        Log.d("Docxion", "Selected text: $text")
    }

    override fun onReady(timestamp: Long) {
        Log.d("Docxion", "Viewer ready: $timestamp")
    }

    override fun onError(message: String, code: String?) {
        Log.d("Docxion", "Error: $message, code: $code")
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

The Android library currently depends on a manually prepared build of the TypeScript viewer.

The current development flow is:

```text
office-viewer
     |
     | npm run build
     v
dist/
     |
     | copy all built files
     v
Docxion/src/main/assets/docxion/
     |
     | Android shell files
     | index.html
     | index.css
     v
Build Docxion Android Library
```

### 1. Build the TypeScript viewer

From the `office-viewer` directory, run:

```bash
npm install
npm run build
```

This produces the viewer distribution under:

```text
office-viewer/dist/
```

### 2. Copy the distribution into Android assets

Copy all required files from:

```text
office-viewer/dist/
```

into:

```text
Docxion/src/main/assets/docxion/
```

The Android assets directory should contain the built viewer files alongside the Android WebView shell files.

The shell currently consists of:

```text
Docxion/src/main/assets/docxion/
│
├── vendor/
├── index.html
├── index.css
├── index.js
├── index.umd.js
└── ...
```

> [!NOTE]
> Unless you want to recreate the Android Bridge to the shell files, you should be using the existing `index.html`, `index.css` and `index.js` that already exists in *Docxion/src/main/assets/docxion*.
>
> All other files/dir (`vendor/` and `index.udm.js`) are the one you copied from dist/

The exact generated files depend on the current `office-viewer` build.

The Android shell files are responsible for loading the bundled viewer and connecting it to the Android JavaScript bridge.

### 3. Build the Android library

After the viewer distribution has been copied into the Android assets directory, build the Android library using Gradle.

For example:

```bash
./gradlew :Docxion:build
```

The resulting Android library can then be used by the example application or another Android project.

### Automated Build

The viewer-to-Android asset copy is currently manual.

Automated scripts for preparing the Android assets and building the complete project will be provided in the future.

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

This keeps document rendering and viewer behavior in the TypeScript/JavaScript layer while the Android library provides the native WebView and Jetpack Compose integration.

---

## Requirements and Limitations

- The API validates that absolute file paths exist before opening them.
- `openFile(Uri)` creates a temporary cached copy for the viewer.
- The wrapper expects to run inside `DocxionWebView`; the API is created from that WebView instance.
- The TypeScript viewer must be built and copied into the Android assets before building the Android library.
- The current viewer-to-Android asset workflow is manual.
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
