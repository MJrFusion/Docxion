# Docxion Android Project

> **Project Status: Early Development**
>
> This project is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

This is the Android Gradle project for [Docxion](../README.md).

It contains the reusable `Docxion` Android library and the `Example` application used to demonstrate and test it.

The TypeScript/JavaScript viewer is developed separately in `office-viewer` and is packaged into the Android library as WebView assets.

## Project Structure

```text
Docxion/
├── settings.gradle
├── build.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
│
├── Docxion/                  Android library
│   ├── build.gradle
│   └── src/
│
└── Example/                  Example application
    ├── build.gradle
    ├── src/
    └── README.md
```

The three main parts are:

- **Root project** — Gradle project containing the Android modules.
- **`Docxion/`** — reusable Android library.
- **`Example/`** — application demonstrating the library.

## Architecture

Docxion uses a WebView to host the TypeScript/JavaScript viewer.

```text
Example Application
        |
        v
Docxion Android Library
        |
        v
Android WebView
        |
        v
WebView Shell
        |
        v
office-viewer
        |
        v
Underlying File Viewer
```

The Android library provides the native API and WebView integration. The TypeScript viewer handles the viewer UI and document interaction, while the underlying file viewer provides document rendering.

Android controls the JavaScript viewer through:

```text
DocxionWebViewApi
        |
        v
window.docxionApi
        |
        v
TypeScript Viewer
```

Viewer events are sent back to Android through:

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
```

The Example application communicates with the viewer through the public Kotlin API exposed by the `Docxion` library.

## Requirements

For Android development, you need:

- Android Studio.
- Android SDK configured for the project.
- A connected Android device or emulator.
- Node.js and npm when rebuilding `office-viewer`.
- A prepared viewer distribution in the `Docxion` library assets.

The exact Android and Gradle versions are defined by the project configuration.

## Build and Run

Open the `Docxion/` directory in Android Studio.

### Build the Example

```bash
./gradlew :Example:assembleDebug
```

### Install the Example

With a connected device or emulator:

```bash
./gradlew :Example:installDebug
```

You can also run the `Example` configuration directly from Android Studio.

### Build the Library

```bash
./gradlew :Docxion:build
```

The `Docxion` module is an Android library and is not run as an application.

## Viewer Assets

The Android library packages a built version of the TypeScript viewer.

Build the viewer from the `office-viewer` project:

```bash
npm install
npm run build
```

This produces:

```text
office-viewer/dist/
```

Copy the generated distribution into:

```text
Docxion/src/main/assets/docxion/
```

The Android assets contain the WebView shell alongside the generated viewer:

```text
Docxion/src/main/assets/docxion/
├── index.html
├── index.css
├── index.js
└── ...
```

The shell files are maintained by the Android project. The generated viewer distribution is copied into the same asset directory.

The current asset preparation process is manual.

## Example Application

The `Example` module depends directly on the local `Docxion` library:

```groovy
dependencies {
    implementation project(':Docxion')
}
```

A basic Compose integration looks like:

```kotlin
DocxionViewer(
    callbacks = callbacks,
    onApiCreated = { api = it }
)
```

The viewer can then be controlled through `DocxionWebViewApi`:

```kotlin
api?.zoomIn()
api?.fitToWidth()
api?.goToNextMatch()
api?.setTheme("dark")
```

Viewer events are received through `DocxionCallbacks`.

See [`Example/README.md`](Example/README.md) for the complete example documentation.

## Development

When changing only the Android library:

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
Copy dist/ to Docxion/src/main/assets/docxion/
    |
    v
Build Android project
    |
    v
Run Example
```

The Example application serves as both a usage example and the primary development environment for testing the Android integration.

## Related Projects

- [`Docxion/README.md`](Docxion/README.md) — Android library documentation.
- [`Example/README.md`](Example/README.md) — Example application documentation.
- `office-viewer` — TypeScript/Vite viewer used by the Android library.

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
