# Docxion Example App

> **Project Status: Early Development**
>
> This example application demonstrates an early-stage Docxion integration. APIs, packaging, and project structure may change as the project evolves.

The Docxion Example App is an Android application that demonstrates the practical, end-to-end usage of the Docxion library.

It hosts `DocxionViewer` in a Jetpack Compose screen, receives a `DocxionWebViewApi` instance through `onApiCreated`, opens documents using the Android system file picker, and controls the viewer through the exposed Kotlin API.

---

## Table of Contents

- [Overview](#overview)
- [What It Demonstrates](#what-it-demonstrates)
- [Project Structure](#project-structure)
- [Build and Run](#build-and-run)
- [How Integration Works](#how-integration-works)
- [Opening Documents](#opening-documents)
- [Viewer Controls](#viewer-controls)
- [Viewer Callbacks](#viewer-callbacks)
- [Android to JavaScript Mapping](#android-to-javascript-mapping)
- [Local Setup](#local-setup)
- [Relationship to the Docxion Library](#relationship-to-the-docxion-library)
- [License](#license)

---

## Overview

The Example app is the reference Android application for the Docxion library.

It demonstrates how an Android application can:

1. Embed the Docxion viewer in Jetpack Compose.
2. Receive the viewer API from the WebView.
3. Open a document selected through the Android file picker.
4. Receive viewer events through `DocxionCallbacks`.
5. Control the viewer from Kotlin.
6. Use page, zoom, search, theme, selection, and printing operations.

The example is intentionally straightforward so that the integration can be used as a starting point for applications that want to embed Docxion.

---

## What It Demonstrates

The application demonstrates:

- `DocxionViewer` embedded in a Compose screen
- `DocxionCallbacks` wired to Android logging
- `DocxionWebViewApi` captured from `onApiCreated`
- Opening a document from the system document picker
- Closing the current document
- Page navigation
- Reading the current page
- Zoom controls
- Fit-to-width and fit-to-page
- Search match navigation
- Clearing search
- Clearing selection
- Light and dark themes
- Printing

---

## Project Structure

The example is an Android application that consumes the sibling Docxion library module.

The relevant repository structure is:

```text
Docxion/
│
├── Docxion/             Android library
│
├── office-viewer/       TypeScript/JavaScript viewer
│
├── Example/             Example Android application
│   ├── app/              Application module
│   ├── gradle/           Gradle configuration
│   └── ...
│
└── README.md
```

The example application uses the local `Docxion` Android library rather than a published dependency.

---

## Build and Run

The example project expects the sibling `Docxion` library folder to remain at:

```text
../Docxion
```

This is configured in:

```text
Example/settings.gradle
```

### Build the Debug APK

From the `Example` directory:

```bash
./gradlew assembleDebug
```

### Install on a Connected Device

To install the debug application on a connected Android device or emulator:

```bash
./gradlew installDebug
```

You can also open the `Example` directory in Android Studio and run the `app` module directly.

---

## How Integration Works

The example activity creates a Compose screen containing the Docxion viewer:

```kotlin
DocxionViewer(
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

`onApiCreated` provides the `DocxionWebViewApi` as soon as the `WebView` is created.

The example stores the API in Compose state and uses it for the controls displayed below the viewer.

A simplified flow is:

```text
Example Compose Screen
        |
        v
DocxionViewer
        |
        v
DocxionWebView
        |
        v
DocxionWebViewApi
        |
        v
window.docxionApi
        |
        v
TypeScript Viewer
```

The viewer reports events back through the callback bridge:

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
Example MainActivity
```

---

## Opening Documents

The example uses Android's:

```kotlin
ActivityResultContracts.OpenDocument()
```

to open the system document picker.

After the user selects a document, the returned `Uri` is passed to Docxion:

```kotlin
api?.openFile(uri)
```

This is the `Uri`-based flow provided by the Docxion library.

The library copies the selected content into its cache and then exposes the temporary file to the JavaScript viewer through the WebView.

A simplified flow is:

```text
Android File Picker
        |
        v
Content Uri
        |
        v
DocxionWebViewApi.openFile(uri)
        |
        v
Temporary Cache File
        |
        v
WebView File Handler
        |
        v
JavaScript File
        |
        v
TypeScript Viewer
```

This allows documents returned by Android content providers to be opened by the JavaScript viewer without requiring the viewer to directly understand Android `Uri` objects.

---

## Viewer Controls

The control row in the example demonstrates the following `DocxionWebViewApi` operations:

```text
closeFile()
goToPage(1)
getCurrentPage { ... }

zoomOut()
zoomIn()
fitToWidth()
fitToPage()

goToPreviousMatch()
goToNextMatch()
clearSearch()

clearSelection()

setTheme("light")
setTheme("dark")

print()
```

For example:

```kotlin
api?.zoomIn()

api?.fitToWidth()

api?.goToNextMatch()

api?.setTheme("dark")
```

Getter methods use callbacks because their values are returned asynchronously from JavaScript.

For example:

```kotlin
api?.getCurrentPage { page ->
    Log.d("Docxion", "Current page: $page")
}
```

The example therefore also demonstrates how an Android UI can update or react to values returned from the WebView.

---

## Viewer Callbacks

The example provides a `DocxionCallbacks` implementation to receive events from the viewer.

The callbacks include:

```kotlin
DocxionCallbacks
```

with:

- `log(message)`
- `onPageChanged(page, totalPages)`
- `onZoomChanged(zoom)`
- `onTextSelected(text)`
- `onReady(timestamp)`
- `onError(message, code)`

The example wires these callbacks to Android logging so that viewer events can be observed while developing or debugging the integration.

For example:

```kotlin
override fun onReady(timestamp: Long) {
    Log.d("Docxion", "Viewer ready: $timestamp")
}

override fun onZoomChanged(zoom: Double) {
    Log.d("Docxion", "Zoom: $zoom")
}

override fun onError(message: String, code: String?) {
    Log.d("Docxion", "Error: $message, code: $code")
}
```

The `onReady` callback is particularly useful when coordinating actions that require the JavaScript viewer to have finished mounting.

---

## Android to JavaScript Mapping

The example demonstrates the same bridge used by the Docxion Android library:

```text
Kotlin
  |
  v
WebView
  |
  v
window.docxionApi
  |
  v
TypeScript ViewerAPI
```

Viewer events are reported in the opposite direction:

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
Kotlin
```

The example does not communicate with the TypeScript viewer directly. It uses the public Kotlin API exposed by `DocxionWebViewApi`.

This is the intended integration pattern for Android applications using Docxion.

---

## Local Setup

Before building the example application, make sure the development environment has:

- Android SDK configured through `local.properties`
- A connected Android device or available emulator
- The sibling `Docxion` module available at `../Docxion`
- The required Docxion viewer assets already prepared in the Android library

The last requirement is important during the current early development stage because the TypeScript viewer build is manually copied into the Android library assets.

See the Docxion Android Library documentation for the current viewer asset build and preparation process.

---

## Relationship to the Docxion Library

The Example app is not a separate viewer implementation.

It is a consumer of the `Docxion` Android library:

```text
Example App
    |
    v
Docxion Android Library
    |
    v
Android WebView
    |
    v
office-viewer
    |
    v
Underlying File Viewer
```

The responsibilities are separated as follows:

- **Example** — demonstrates Android application integration.
- **Docxion** — provides the Android and Jetpack Compose wrapper.
- **office-viewer** — provides the TypeScript/JavaScript viewer layer.
- **Underlying file viewer** — provides the document viewing and rendering functionality.

The example application therefore serves as both a usage example and a practical integration test for the Android library.

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
