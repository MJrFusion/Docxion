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
- Receiving text-selection geometry from the viewer

---

## Project Structure

The `Example` module is an Android application within the Docxion repository. It consumes the sibling `Docxion` Android library module.

The relevant repository structure is:

```text
Docxion/
│
├── settings.gradle
├── build.gradle
├── gradle.properties
│
├── Docxion/                 Android library module
│   ├── build.gradle
│   └── src/
│
└── Example/                 Example Android application
    ├── build.gradle
    ├── src/
    └── README.md
```

The `Example` module consumes the local `Docxion` module through a Gradle project dependency:

```groovy
implementation project(':Docxion')
```

This allows the example application to use the current library source directly during development without requiring a published Docxion artifact.

---

## Build and Run

Open the **repository root** in Android Studio:

```text
Docxion/
```

The root directory is the Gradle project and contains both the `Docxion` library module and the `Example` application module.

### Build the Debug APK

From the repository root:

```bash
./gradlew :Example:assembleDebug
```

### Install on a Connected Device

To install the debug application on a connected Android device or emulator:

```bash
./gradlew :Example:installDebug
```

You can also select the `Example` run configuration in Android Studio and run it directly.

The `Docxion` module is an Android library and is therefore not run independently. It is compiled as a dependency of the `Example` application.

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

`onApiCreated` provides the `DocxionWebViewApi` when the viewer API becomes available.

The example stores the API and uses it to control the viewer through the controls displayed in the application.

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
Example Application
```

The example application does not communicate with the TypeScript viewer directly. It uses the public Kotlin API and callback interfaces provided by Docxion.

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

This is the `Uri`-based document-opening flow provided by the Docxion library.

The library handles the Android `Uri` and exposes the document to the JavaScript viewer through the WebView.

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
DocxionWebView
        |
        v
WebView File Handler
        |
        v
JavaScript Viewer
```

This allows documents returned by Android content providers to be opened without requiring the TypeScript viewer to understand Android `Uri` objects.

---

## Viewer Controls

The example demonstrates the following `DocxionWebViewApi` operations:

```text
closeFile()
goToPage(1)
getCurrentPage()

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

The example therefore demonstrates how an Android UI can both control the viewer and react to values returned from the WebView.

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
- `onTextSelected(selection)`
- `onReady(timestamp)`
- `onError(message, code)`

The example wires these callbacks to Android logging so that viewer events can be observed during development and debugging.

For example:

```kotlin
override fun onReady(timestamp: Long) {
    Log.d("Docxion", "Viewer ready: $timestamp")
}

override fun onZoomChanged(zoom: Double) {
    Log.d("Docxion", "Zoom: $zoom")
}

override fun onTextSelected(selection: TextSelection?) {
    Log.d("Docxion", "Text selection: $selection")
}

override fun onError(message: String, code: String?) {
    Log.e("Docxion", "Error: $message, code: $code")
}
```

The `onReady` callback is particularly useful when coordinating actions that require the JavaScript viewer to have finished mounting.

---

## Android to JavaScript Mapping

The example demonstrates the bridge used internally by the Docxion Android library:

```text
Kotlin
  |
  v
DocxionWebViewApi
  |
  v
WebView
  |
  v
window.docxionApi
  |
  v
TypeScript Viewer API
```

Viewer events are reported in the opposite direction:

```text
TypeScript Viewer
  |
  v
window.DocxionAndroid
  |
  v
DocxionJsBridge
  |
  v
DocxionCallbacks
  |
  v
Kotlin
```

Structured JavaScript values such as text-selection geometry are serialized across the JavaScript interface boundary and converted into Kotlin models by the Docxion bridge.

The example application does not need to interact with these bridge details directly. It uses the public `DocxionWebViewApi` and `DocxionCallbacks` interfaces.

This is the intended integration pattern for Android applications using Docxion.

---

## Local Setup

Before building the example application, make sure the development environment has:

- Android SDK configured through `local.properties`
- A connected Android device or available emulator
- The `Docxion` library module available in the same Gradle project
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
TypeScript Viewer
    |
    v
Underlying File Viewer
```

The responsibilities are separated as follows:

- **Example** — demonstrates Android application integration.
- **Docxion** — provides the Android and Jetpack Compose wrapper and WebView integration.
- **TypeScript Viewer** — provides the JavaScript viewer layer.
- **Underlying File Viewer** — provides the document viewing and rendering functionality.

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
