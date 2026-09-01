# Docxion Example App

> Project Status: Early Development
>
> This example application demonstrates an early-stage Docxion integration. APIs, packaging, and project structure may change as the project evolves.

This Android app shows the practical end-to-end integration of the Docxion library. It hosts `DocxionViewer`, receives a `DocxionWebViewApi` instance through `onApiCreated`, opens documents with the Android file picker, and drives the viewer through the exposed API.

## What It Demonstrates

- `DocxionViewer` embedded in a Compose screen
- `DocxionCallbacks` wired to Android logging
- `DocxionWebViewApi` captured from `onApiCreated`
- Opening a document from the system document picker
- Viewer controls such as page navigation, zoom, search navigation, theme selection, and printing

## Build and Run

The example project expects the sibling `Docxion` library folder to remain at `../Docxion`, as configured in `Example/settings.gradle`.

From the `Example` directory:

```bash
./gradlew assembleDebug
```

To install the app on a connected device or emulator:

```bash
./gradlew installDebug
```

You can also open the `Example` directory in Android Studio and run the `app` module from there.

## How Integration Works

The example activity creates a Compose screen that looks like this in practice:

```kotlin
DocxionViewer(
    callbacks = callbacks,
    onApiCreated = { createdApi ->
        api = createdApi
    }
)
```

`onApiCreated` provides the `DocxionWebViewApi` as soon as the `WebView` is created. The screen stores that API in state and uses it for the control row below the viewer.

## Opening Documents

The example uses `ActivityResultContracts.OpenDocument()` to pick a document from the system file picker and then calls:

```kotlin
api?.openFile(uri)
```

This is the `Uri`-based flow documented by the library. The API copies the document into cache and then hands it to the viewer.

## Viewer Controls

The control row in the example calls these methods on `DocxionWebViewApi`:

- `closeFile()`
- `goToPage(1)`
- `getCurrentPage { ... }`
- `zoomOut()`
- `zoomIn()`
- `fitToWidth()`
- `fitToPage()`
- `goToPreviousMatch()`
- `goToNextMatch()`
- `clearSearch()`
- `clearSelection()`
- `setTheme("light")`
- `setTheme("dark")`
- `print()`

## Android to JavaScript Mapping

The example demonstrates the same bridge used by the library:

`Kotlin -> WebView -> window.docxionApi -> TypeScript ViewerAPI`

Viewer events are reported back through `window.DocxionAndroid` and are logged by the `DocxionCallbacks` implementation in `MainActivity`.

## Local Setup

- Android SDK configured through `local.properties`
- A device or emulator available for installation
- The sibling `Docxion` module present at `../Docxion`

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](../LICENSE) file for details.
