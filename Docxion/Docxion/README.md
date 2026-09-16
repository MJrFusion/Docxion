# Docxion Android Library

> **Project Status: Early Development**
>
> Docxion is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

Docxion is an Android library that embeds the Docxion web viewer in an Android `WebView` and exposes it through a Kotlin/Jetpack Compose API.

The Android library provides the native integration layer: WebView hosting, the public Kotlin API, Android file handling, local WebView URL handling, and communication between JavaScript and Android.

The document viewer itself is implemented in the separate [`office-viewer`](../office-viewer/) project.

## Overview

The Android library provides three main public integration points:

* `DocxionViewer` — the Jetpack Compose entry point for embedding the viewer.
* `DocxionWebViewApi` — the Kotlin control API exposed to the host application.
* `DocxionCallbacks` — callbacks for events common to the viewer, with optional capability-specific callback interfaces for additional document features.

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
implementation 'com.github.MJrFusion:Docxion:<version>'
```

Kotlin DSL:

```kotlin
implementation("com.github.MJrFusion:Docxion:<version>")
```

Replace `<version>` with the release you want to consume. See the repository's release and tag history for available versions.

## Basic Setup

Embed the viewer in a Jetpack Compose screen and capture its API:

```kotlin
var api by remember { mutableStateOf<DocxionWebViewApi?>(null) }

val callbacks = object : DocxionCallbacks,
    PaginationCallbacks,
    SelectionCallbacks {

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

DocxionViewer(
    modifier = Modifier.fillMaxSize(),
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

A single callback object can implement multiple callback capabilities. The base `DocxionCallbacks` contains only events that are common to the viewer, while optional interfaces such as `PaginationCallbacks` and `SelectionCallbacks` provide additional document capabilities.

For example, an application that only needs common viewer events can implement `DocxionCallbacks` without implementing pagination or selection callbacks:

```kotlin
val callbacks = object : DocxionCallbacks {

    override fun log(message: String) {
        Log.d("Docxion", message)
    }

    override fun onReady(timestamp: Long) {
        Log.d("Docxion", "Viewer ready: $timestamp")
    }

    override fun onError(message: String, code: String?) {
        Log.e("Docxion", "Error: $message, code: $code")
    }
}
```

An application that needs pagination can additionally implement `PaginationCallbacks`:

```kotlin
val callbacks = object : DocxionCallbacks, PaginationCallbacks {

    override fun onPageChanged(page: Int, totalPages: Int) {
        Log.d("Docxion", "Page: $page / $totalPages")
    }
}
```

An application that needs selection can implement `SelectionCallbacks`:

```kotlin
val callbacks = object : DocxionCallbacks, SelectionCallbacks {

    override fun onTextSelected(selection: TextSelection?) {
        Log.d("Docxion", "Selection: $selection")
    }
}
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

### Capture

```text
capture(width: Int, height: Int, callback)

capture(height: Int, callback)

capture(aspectRatio: CaptureAspectRatio, callback)
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

api?.setTheme(Theme.DARK)
```

Methods that return values from JavaScript use callbacks because the results are returned asynchronously through `WebView.evaluateJavascript()`.

For example:

```kotlin
api?.getCurrentPage { page ->
    Log.d("Docxion", "Current page: $page")
}
```

Search results are returned in the format produced by the JavaScript viewer. The TypeScript viewer remains the source of truth for that result format.

## Themes

Docxion exposes the supported viewer themes through the `Theme` enum:

```kotlin
enum class Theme(
    val value: String
) {
    LIGHT("light"),
    DARK("dark")
}
```

Set the theme with:

```kotlin
api?.setTheme(Theme.DARK)
```

Read the current theme asynchronously:

```kotlin
api?.getTheme { theme ->
    Log.d("Docxion", "Theme: $theme")
}
```

## Capture

Docxion can capture the rendered viewer and return the result as PNG image data.

### Exact dimensions

Specify both the output width and height:

```kotlin
api?.capture(
    width = 1080,
    height = 1920
) { png ->
    // png is the encoded PNG image data
}
```

The requested dimensions are exact output dimensions in pixels.

### Full viewer width

Specify only the output height:

```kotlin
api?.capture(1920) { png ->
    // png is the encoded PNG image data
}
```

The output width is inferred from the viewer's current width.

### Aspect ratio

Specify one of the supported `CaptureAspectRatio` values:

```kotlin
api?.capture(
    CaptureAspectRatio.RATIO_9_16
) { png ->
    // png is the encoded PNG image data
}
```

Available aspect ratios:

```kotlin
enum class CaptureAspectRatio(
    val value: String
) {
    RATIO_1_1("1:1"),
    RATIO_16_9("16:9"),
    RATIO_9_16("9:16"),
    RATIO_4_3("4:3"),
    RATIO_3_4("3:4"),
    RATIO_3_2("3:2")
}
```

The aspect ratio determines the output dimensions when the capture height is calculated automatically from the viewer width.

All capture overloads return the encoded PNG through a callback as a Kotlin `ByteArray`.

## Viewer Callbacks

Docxion separates callbacks into a base interface for common viewer events and optional interfaces for document capabilities.

This allows applications to use a single callback object while implementing only the capabilities they need.

### Base Callbacks

Implement `DocxionCallbacks` to receive events that are common to the viewer:

```kotlin
val callbacks = object : DocxionCallbacks {

    override fun log(message: String) {
        Log.d("Docxion", message)
    }

    override fun onZoomChanged(zoom: Double) {
        Log.d("Docxion", "Zoom: $zoom")
    }

    override fun onReady(timestamp: Long) {
        Log.d("Docxion", "Viewer ready: $timestamp")
    }

    override fun onError(message: String, code: String?) {
        Log.e("Docxion", "Error: $message, code: $code")
    }
}
```

The base callbacks are:

```text
log(message)

onZoomChanged(zoom)

onReady(timestamp)

onError(message, code)
```

These callbacks are not tied to a specific document type.

### Pagination Callbacks

Pagination is exposed separately through `PaginationCallbacks`:

```kotlin
val callbacks = object : DocxionCallbacks, PaginationCallbacks {

    override fun onPageChanged(
        page: Int,
        totalPages: Int
    ) {
        Log.d("Docxion", "Page: $page / $totalPages")
    }
}
```

The pagination callback is:

```text
onPageChanged(page, totalPages)
```

Applications that do not need pagination do not need to implement `PaginationCallbacks`.

### Selection Callbacks

Text selection is exposed separately through `SelectionCallbacks`:

```kotlin
val callbacks = object : DocxionCallbacks, SelectionCallbacks {

    override fun onTextSelected(selection: TextSelection?) {
        Log.d("Docxion", "Selection: $selection")
    }
}
```

The selection callback is:

```text
onTextSelected(selection)
```

Applications that do not need text-selection events do not need to implement `SelectionCallbacks`.

### Multiple Capabilities

A single callback object can implement as many capabilities as required:

```kotlin
class MyCallbacks :
    DocxionCallbacks,
    PaginationCallbacks,
    SelectionCallbacks {

    override fun log(message: String) {
        Log.d("Docxion", message)
    }

    override fun onZoomChanged(zoom: Double) {
        Log.d("Docxion", "Zoom: $zoom")
    }

    override fun onReady(timestamp: Long) {
        Log.d("Docxion", "Viewer ready: $timestamp")
    }

    override fun onError(message: String, code: String?) {
        Log.e("Docxion", "Error: $message, code: $code")
    }

    override fun onPageChanged(
        page: Int,
        totalPages: Int
    ) {
        Log.d("Docxion", "Page: $page / $totalPages")
    }

    override fun onTextSelected(selection: TextSelection?) {
        Log.d("Docxion", "Selection: $selection")
    }
}
```

`DocxionViewer` continues to accept a single callback object:

```kotlin
DocxionViewer(
    callbacks = MyCallbacks()
)
```

This avoids requiring separate callback objects when an application supports multiple document types or capabilities.

Internally, `DocxionWebView` can detect optional capabilities before dispatching capability-specific events:

```kotlin
(callbacks as? PaginationCallbacks)
    ?.onPageChanged(page, totalPages)
```

The same approach can be used for other optional callback capabilities as they are introduced.

The callback architecture is capability-oriented rather than document-type-oriented. Applications therefore do not need separate callback interfaces such as `WordCallbacks`, `ExcelCallbacks`, or `PowerPointCallbacks`.

## Text Selection

The viewer can report the geometry of the current text selection to Android through `SelectionCallbacks`.

The callback receives a `TextSelection?`:

```kotlin
override fun onTextSelected(selection: TextSelection?) {
    Log.d("Docxion", "Selection: $selection")
}
```

A `null` selection represents the absence of an active selection.

Selection geometry is converted from the JavaScript representation into Kotlin models by the Android bridge.

A selection may span multiple lines and therefore contain multiple visual rectangles.

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
   Android WebView        Web Viewer Assets
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

DocxionWebView

        |

        +------------------------------+
        |                              |
        v                              v
DocxionCallbacks              Optional capabilities
        |                     PaginationCallbacks
        |                     SelectionCallbacks
        |                              |
        +--------------+---------------+
                       |
                       v
              Host Android Application
```

The Android bridge dispatches common viewer events through `DocxionCallbacks` and checks for optional callback capabilities before dispatching capability-specific events.

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

* Android Studio with the project's configured Android SDK and JDK.
* Node.js and npm for building `office-viewer`.
* The Gradle Wrapper included in the repository.
* An Android device or emulator for running the Example application.

The Android project uses the Gradle Wrapper, so a system-wide Gradle installation is not required.

## Project Structure

```text
Docxion Repository

│
├── office-viewer/
│   └── TypeScript / JavaScript viewer
│
└── Docxion/
    ├── Android library
    └── Example/
        └── Android integration example
```

Responsibilities are separated between the projects:

* **`Docxion` Android library** — native Android API, Compose integration, WebView hosting, file handling, capture, and JavaScript bridge.
* **`office-viewer`** — web-based document viewer and its generated distribution.
* **`Example`** — demonstrates consuming the Android library from an Android application.

## Callback Design

Docxion uses capability-oriented callbacks so that the public API does not require consumers to implement events that are unrelated to the capabilities they use.

The base interface contains common viewer events:

```kotlin
interface DocxionCallbacks {

    fun log(message: String) {}

    fun onReady(timestamp: Long) {}

    fun onZoomChanged(zoom: Double) {}

    fun onError(
        message: String,
        code: String?
    ) {}
}
```

Optional capabilities are represented by separate interfaces:

```kotlin
interface PaginationCallbacks {

    fun onPageChanged(
        page: Int,
        totalPages: Int
    )
}
```

```kotlin
interface SelectionCallbacks {

    fun onTextSelected(
        selection: TextSelection?
    )
}
```

A consumer can combine these interfaces in a single callback implementation:

```kotlin
class MyCallbacks :
    DocxionCallbacks,
    PaginationCallbacks,
    SelectionCallbacks {

    override fun onPageChanged(
        page: Int,
        totalPages: Int
    ) {
        // Handle pagination
    }

    override fun onTextSelected(
        selection: TextSelection?
    ) {
        // Handle selection
    }
}
```

This design provides several benefits:

* Keeps `DocxionCallbacks` focused on events common to the viewer.
* Prevents consumers from implementing irrelevant callbacks.
* Allows one callback class to support multiple capabilities.
* Avoids coupling the callback API directly to document MIME types.
* Makes adding new document formats less disruptive to the public API.
* Provides a scalable model for future document-specific capabilities.
* Keeps the Compose API simple by continuing to accept a single callback object.

Capability interfaces are intentionally independent from document type. A document format can expose one or more capabilities without requiring a new callback hierarchy for every format.

## Related Documentation

* [`Example/README.md`](Example/README.md) — Android integration example.
* [`office-viewer/README.md`](../office-viewer/README.md) — TypeScript viewer documentation.
* [`../README.md`](../README.md) — repository documentation.

## License

```text
Copyright 2026 MJrFusion

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied.

See the License for the specific language governing permissions and
limitations under the License.
```
