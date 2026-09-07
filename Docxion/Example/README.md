# Docxion Example App

> **Project Status: Early Development**
>
> This example application is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

The `Docxion Example App` is an Android application demonstrating how to integrate the Docxion Android library.

It shows how to embed `DocxionViewer` in Jetpack Compose, open documents through Android's system document picker, control the viewer through `DocxionWebViewApi`, and receive events through `DocxionCallbacks`.

## Features

- `DocxionViewer` embedded in Jetpack Compose
- Opening documents with Android's system document picker
- Page navigation
- Zoom and fit controls
- Search navigation
- Light and dark themes
- Text selection callbacks
- Printing
- `DocxionWebViewApi` usage
- `DocxionCallbacks` usage

The Example app is a consumer of the Docxion library. It does not implement the document viewer itself.

## Project Structure

The Example app is an Android application module inside the Docxion Android project:

```text
Docxion/
├── Docxion/                 Android library
│   ├── build.gradle
│   └── src/
│
└── Example/                 Example application
    ├── build.gradle
    ├── src/
    └── README.md
```

The Example module uses the local `Docxion` library directly:

```groovy
dependencies {
    implementation project(':Docxion')
}
```

This allows the application to run against the current library source without requiring a published artifact.

## Architecture

The Example app uses the public Android API provided by the Docxion library:

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
Android WebView
        |
        v
TypeScript Viewer
```

Android controls the viewer through:

```text
DocxionWebViewApi
        |
        v
JavaScript Viewer
```

Viewer events are received through:

```text
JavaScript Viewer
        |
        v
DocxionCallbacks
        |
        v
Example App
```

The Example app does not communicate with the JavaScript viewer directly. It uses `DocxionWebViewApi` and `DocxionCallbacks`.

## Requirements

For local development, you need:

- Android Studio.
- Android SDK configured for the project.
- A connected Android device or emulator.
- The `Docxion` library module in the same Gradle project.
- Prepared Docxion WebView assets.

## Build and Run

Open the Android project root in Android Studio:

```text
Docxion/
```

### Build the Debug APK

From the Android project root:

```bash
./gradlew :Example:assembleDebug
```

### Install on a Connected Device

```bash
./gradlew :Example:installDebug
```

You can also select the `Example` run configuration in Android Studio and run it directly.

## Basic Integration

The viewer can be embedded in a Compose screen:

```kotlin
DocxionViewer(
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

`onApiCreated` provides the `DocxionWebViewApi` once the viewer API is available.

The resulting integration is:

```text
Compose UI
    |
    v
DocxionViewer
    |
    v
DocxionWebViewApi
    |
    v
JavaScript Viewer
```

## Opening Documents

The Example app uses Android's system document picker:

```kotlin
ActivityResultContracts.OpenDocument()
```

After the user selects a document, its `Uri` is passed to Docxion:

```kotlin
api?.openFile(uri)
```

The flow is:

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
Docxion WebView
        |
        v
JavaScript Viewer
```

## Viewer Controls

The Example app exercises the public `DocxionWebViewApi`.

Common operations include:

```text
closeFile()

goToPage(...)

getCurrentPage()

zoomIn()
zoomOut()

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

The Example app demonstrates the `DocxionCallbacks` interface:

```text
log(message)

onPageChanged(page, totalPages)

onZoomChanged(zoom)

onTextSelected(selection)

onReady(timestamp)

onError(message, code)
```

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

`onReady` can be used when an application needs to coordinate operations with the viewer after it has finished mounting.

## Development

The Example app is intended to be both a usage reference and a practical integration environment for the Docxion Android library.

When changing the Android library:

```text
Edit Docxion
    |
    v
Build Android project
    |
    v
Run Example
```

When changing the TypeScript viewer:

```text
Edit office-viewer
    |
    v
npm run build
    |
    v
Copy viewer distribution to Docxion assets
    |
    v
Build Android project
    |
    v
Run Example
```

The TypeScript viewer is developed separately in `office-viewer` and packaged into the Android library as WebView assets.

## Related Projects

- [`Docxion/README.md`](../Docxion/README.md) — Android library documentation.
- `office-viewer` — TypeScript/Vite viewer used by the Android library.
- [`../README.md`](../README.md) — Android project documentation.

## License

                Copyright 2026 MJrFusion

        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

                http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
        implied.
        See the License for the specific language governing permissions 
        and limitations under the License.