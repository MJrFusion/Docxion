# Docxion Android Library

> **Project Status: Early Development**
>
> Docxion is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

Docxion is an Android library that embeds the Docxion web viewer in an Android `WebView` and exposes it through a Kotlin/Jetpack Compose API.

The Android library provides the native integration layer: WebView hosting, the public Kotlin API, Android file handling, local WebView URL handling, and communication between JavaScript and Android.

The document viewer itself is implemented in the separate [`office-viewer`](../office-viewer/) project.

## Overview

The Android library provides three main public integration points:

- `DocxionViewer` — the Jetpack Compose entry point for embedding the viewer.
- `DocxionWebViewApi` — the Kotlin control API exposed to the host application.
- `DocxionCallbacks` — callbacks for events originating from the viewer.

The integration is based on a JavaScript bridge:

```text
Android / Kotlin
      |
      v
DocxionViewer
      |
      v
DocxionWebView
      |
      +----------------------+
      |                      |
      v                      v
window.docxionApi     window.DocxionAndroid
      |                      |
      v                      v
JavaScript Viewer       Android callbacks
```

The Android library does not implement document rendering itself. It hosts the web viewer and provides the native Android integration around it.

## Installation

### Local Project

During development, the library can be consumed as the `Docxion` module from the Android project:

```groovy
implementation project(':Docxion')
```

The library namespace is:

```text
com.mjrfusion.docxion
```

### Published Artifact

Docxion is distributed through JitPack.

Add JitPack to the consuming project's repositories:

```groovy
maven { url = uri('https://jitpack.io') }
```

Then add the Docxion dependency:

```groovy
implementation 'com.github.mjrfusion:docxion:<version>'
```

Kotlin DSL:

```kotlin
implementation("com.github.mjrfusion:docxion:<version>")
```

Replace `<version>` with the release you want to consume. See the repository's release and tag history for available versions.

## Basic Setup

Embed the viewer in a Jetpack Compose screen and capture its API:

```kotlin
var api by remember { mutableStateOf<DocxionWebViewApi?>(null) }

val callbacks = object : DocxionCallbacks {
    override fun log(message: String) {}
    override fun onPageChanged(page: Int, totalPages: Int) {}
    override fun onZoomChanged(zoom: Double) {}
    override fun onTextSelected(selection: TextSelection?) {}
    override fun onReady(timestamp: Long) {}
    override fun onError(message: String, code: String?) {}
}

DocxionViewer(
    modifier = Modifier.fillMaxSize(),
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

`onApiCreated` provides the `DocxionWebViewApi` when the native viewer API becomes available.

The API can become available before the JavaScript viewer has finished mounting. Use `onReady` when an operation must wait for the JavaScript viewer to be ready.

## Opening Documents

Docxion currently supports opening documents through either an Android `Uri` or an absolute filesystem path.

### Content URI

Use `openFile(uri: Uri)` for documents returned by Android document providers:

```kotlin
api?.openFile(selectedUri)
```

The library copies the content into its temporary cache before exposing it to the WebView viewer.

The temporary cached copy is managed by the library and removed when the viewer is destroyed.

### Absolute Filesystem Path

Use `openFile(file: String)` with an absolute path to an existing file:

```kotlin
api?.openFile("/absolute/path/to/document.docx")
```

The path is registered with Docxion's WebView file handler and exposed to the JavaScript viewer through a local WebView URL.

## Viewer Callbacks

Implement `DocxionCallbacks` to receive events from the JavaScript viewer:

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

The callbacks are delivered from the JavaScript viewer through the Android bridge exposed as:

```text
window.DocxionAndroid
```

## Public API

`DocxionWebViewApi` exposes the native control surface for the viewer.

### Documents

```text
openFile(uri: Uri)
openFile(file: String)
closeFile()
getCurrentFile(callback)
```

### Pages

```text
goToPage(page: Int)
getCurrentPage(callback)
getTotalPages(callback)
```

### Zoom

```text
setZoom(zoom: Double)
getZoom(callback)
zoomIn(step: Double? = null)
zoomOut(step: Double? = null)
fitToWidth()
fitToPage()
```

### Search

```text
search(query, callback)
clearSearch()
goToNextMatch()
goToPreviousMatch()
```

### Selection

```text
getSelectedText(callback)
clearSelection()
```

### Appearance

```text
setTheme(theme)
getTheme(callback)
```

### Other

```text
print()
destroy()
isReady(callback)
```

For example:

```kotlin
api?.goToPage(2)
api?.zoomIn()
api?.fitToWidth()
api?.setTheme("dark")
```

Methods that return values from JavaScript use callbacks because the results are returned asynchronously through `WebView.evaluateJavascript()`.

For example:

```kotlin
api?.getCurrentPage { page ->
    Log.d("Docxion", "Current page: $page")
}
```

Search results are returned in the format produced by the JavaScript viewer. The TypeScript viewer remains the source of truth for that result format.

## Text Selection

The viewer can report the geometry of the current text selection to Android.

The callback receives:

```kotlin
override fun onTextSelected(selection: TextSelection?) {
    Log.d("Docxion", "Selection: $selection")
}
```

A `null` selection represents the absence of an active text selection.

Selection geometry is converted from the JavaScript representation into Kotlin models by the Android bridge.

## Architecture

The Android library sits between the host Android application and the TypeScript viewer:

```text
Host Android Application
          |
          v
   DocxionViewer
          |
          v
    DocxionWebView
          |
          +----------------------+
          |                      |
          v                      v
 Android WebView          Web Viewer Assets
          |                      |
          +----------+-----------+
                     |
                     v
              TypeScript Viewer
```

Commands travel from Kotlin to JavaScript through:

```text
DocxionWebViewApi
        |
        v
window.docxionApi
        |
        v
TypeScript Viewer API
```

Events travel in the opposite direction:

```text
TypeScript Viewer
        |
        v
window.DocxionAndroid
        |
        v
DocxionCallbacks
        |
        v
Host Android Application
```

The Android library therefore provides the native hosting and bridge layer while keeping viewer behavior in the web implementation.

## Web Viewer Assets

The Android library contains a small native WebView shell under:

```text
Docxion/src/main/assets/docxion/
```

The shell contains the Android-side web entry files, while the generated web viewer distribution is produced by `office-viewer`.

The assembled assets have this general structure:

```text
Docxion/src/main/assets/docxion/

├── index.html
├── index.css
├── index.js
├── index.umd.js
├── vendor/
└── ...
```

The generated files depend on the current `office-viewer` build.

The important distinction is:

```text
Android WebView shell
        +
office-viewer distribution
        =
Docxion WebView assets
```

The generated viewer assets are build artifacts and are not maintained as ordinary source files in the Android library.

## Build and Development

The repository contains both the Android project and the separate TypeScript viewer project.

A complete local build consists of:

```text
office-viewer
      |
      | npm ci
      | npm run build
      v
office-viewer/dist/
      |
      | copy generated distribution
      v
Docxion/src/main/assets/docxion/
      |
      | Gradle
      v
Android library
```

### Build the Web Viewer

From the repository root:

```bash
cd office-viewer
npm ci
npm run build
```

This produces:

```text
office-viewer/dist/
```

Copy the generated distribution into the Android library assets:

```bash
cp -R office-viewer/dist/. Docxion/Docxion/src/main/assets/docxion/
```

Do not delete or replace the existing Android WebView shell files when copying the distribution. The generated files are assembled alongside the permanent shell.

### Build the Android Library

From the Android project root:

```bash
./gradlew :Docxion:build
```

### Build the Example

```bash
./gradlew :Example:assembleDebug
```

The Example application is the primary local consumer and integration test for the Android library.

## Automated Build

The repository's GitHub Actions CI builds the web viewer first, copies its generated distribution into the Android library assets, and then builds the Android project.

The release pipeline uses the resulting Android-ready assets when preparing a release.

Generated viewer assets remain build artifacts rather than normal source files on `main`.

For release builds, the generated assets are temporarily committed to the release commit/tag and then removed again from `main`.

## Development Requirements

Development requires:

- Android Studio with the project's configured Android SDK and JDK.
- Node.js and npm for building `office-viewer`.
- The Gradle Wrapper included in this repository.
- An Android device or emulator for running the Example application.

The Android project uses the Gradle Wrapper, so a system-wide Gradle installation is not required.

## Relationship to Other Projects

Docxion is composed of separate layers:

```text
Docxion Repository
│
├── office-viewer/
│       TypeScript / JavaScript viewer
│
└── Docxion/
        Android library
        │
        └── Example/
                Android integration example
```

Responsibilities are intentionally separated:

- **`Docxion` Android library** — native Android API, Compose integration, WebView hosting, file handling, and JavaScript bridge.
- **`office-viewer`** — web-based document viewer and its generated distribution.
- **`Example`** — demonstrates consuming the Android library from an Android application.

See the [Example project's README](Example/README.md) for application-level integration examples.

## Related Documentation

- [Docxion repository](../README.md)
- [Example application](Example/README.md)
- [office-viewer](../office-viewer/README.md)

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
