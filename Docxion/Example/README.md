# Docxion Example App

> **Project Status: Early Development**
>
> This example application demonstrates an early-stage Docxion integration. APIs, packaging, and project structure may change as the project evolves.

The **Docxion Example App** is an Android application that demonstrates how to integrate and use the Docxion Android library.

It provides a practical reference for embedding `DocxionViewer` in Jetpack Compose, opening documents through the Android system file picker, controlling the viewer through `DocxionWebViewApi`, and receiving viewer events through `DocxionCallbacks`.

## Overview

The Example app is a reference consumer of the Docxion Android library.

It demonstrates how an Android application can:

- Embed `DocxionViewer` in a Jetpack Compose UI.
- Obtain the viewer API through `onApiCreated`.
- Open documents using the Android system document picker.
- Control document navigation, zoom, search, themes, selection, and printing.
- Receive viewer events through `DocxionCallbacks`.
- Observe the Android ↔ JavaScript integration exposed by Docxion.

The Example app is intentionally focused on **library integration**. It does not implement the document viewer itself.

## What It Demonstrates

The application currently demonstrates:

- `DocxionViewer` embedded in a Compose screen.
- `DocxionWebViewApi` captured through `onApiCreated`.
- `DocxionCallbacks` connected to Android logging.
- Opening a document with `ActivityResultContracts.OpenDocument`.
- Closing the current document.
- Page navigation and current-page queries.
- Zoom in/out.
- Fit-to-width and fit-to-page.
- Search match navigation and clearing search.
- Clearing text selection.
- Light and dark themes.
- Printing.
- Receiving text-selection geometry from the viewer.

## Project Structure

The Example app is an Android application module inside the Docxion Android project:

```text
Docxion/
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

The Example module consumes the sibling `Docxion` library module directly:

```groovy
implementation project(':Docxion')
```

This allows the example to exercise the current library source without requiring a published Docxion artifact.

## Build and Run

Open the **Android project** in Android Studio:

```text
Docxion/
```

The project contains both the `Docxion` library module and the `Example` application module.

### Build the Debug APK

From the Android project root:

```bash
./gradlew :Example:assembleDebug
```

### Install on a Connected Device

```bash
./gradlew :Example:installDebug
```

Alternatively, select the `Example` run configuration in Android Studio and run it normally.

The `Docxion` module is a library and is not launched independently.

## Basic Integration

The example creates a Compose screen containing the viewer and captures its API:

```kotlin
DocxionViewer(
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

`onApiCreated` provides the `DocxionWebViewApi` once the viewer API becomes available.

The resulting integration is:

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
JavaScript Viewer
```

The Example app interacts with the viewer through the public Kotlin API and callback interfaces. It does not communicate with the JavaScript viewer directly.

## Opening Documents

The example uses Android's system document picker:

```kotlin
ActivityResultContracts.OpenDocument()
```

After the user selects a document, its `Uri` is passed to Docxion:

```kotlin
api?.openFile(uri)
```

The resulting flow is:

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
JavaScript Viewer
```

This demonstrates the intended Android integration for documents returned by Android content providers.

## Viewer Controls

The example exercises the public `DocxionWebViewApi`, including operations such as:

```text
closeFile()
goToPage(...)
getCurrentPage()

zoomOut()
zoomIn()
fitToWidth()
fitToPage()

goToPreviousMatch()
goToNextMatch()
clearSearch()

clearSelection()

setTheme(...)
print()
```

For example:

```kotlin
api?.zoomIn()

api?.fitToWidth()

api?.goToNextMatch()

api?.setTheme("dark")
```

Operations that return values from JavaScript are asynchronous. For example:

```kotlin
api?.getCurrentPage { page ->
    Log.d("Docxion", "Current page: $page")
}
```

## Viewer Callbacks

The Example app also demonstrates the `DocxionCallbacks` interface.

The callbacks include:

```text
log(message)
onPageChanged(page, totalPages)
onZoomChanged(zoom)
onTextSelected(selection)
onReady(timestamp)
onError(message, code)
```

The example connects these callbacks to Android logging:

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

`onReady` can be used when an application needs to coordinate operations with the JavaScript viewer after it has finished mounting.

## Android ↔ JavaScript Integration

The Example app exercises the bridge exposed by the Docxion Android library.

Android-to-JavaScript:

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
JavaScript Viewer
```

JavaScript-to-Android:

```text
JavaScript Viewer
  |
  v
Android JavaScript Bridge
  |
  v
DocxionCallbacks
  |
  v
Kotlin
```

Structured values such as text-selection geometry are serialized across the JavaScript interface and converted into Kotlin models by the Docxion bridge.

The Example app intentionally stays at the public API level; applications using Docxion should normally use `DocxionWebViewApi` and `DocxionCallbacks` rather than the internal bridge implementation.

## Local Development

For local development, the Example app requires:

- An Android SDK configured for the project.
- A connected Android device or available emulator.
- The `Docxion` library module in the same Gradle project.
- The Docxion web viewer assets prepared in the Android library.

During early development, the web viewer build is generated separately and bundled into the Android library assets as part of the project build/release process.

For details about the Android library implementation and asset preparation, see the documentation in the parent Android project.

## Relationship to Docxion

The Example app is a consumer of the Docxion Android library:

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
- **Docxion Android library** — provides the Android/Compose API and WebView integration.
- **TypeScript viewer** — provides the JavaScript viewer layer.
- **Underlying file viewer** — provides the document viewing and rendering functionality.

The Example app therefore serves as both a usage reference and a practical integration test for the Android library.

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
