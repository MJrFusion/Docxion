# Docxion Android Project

> **Project Status: Early Development**
>
> This project contains the Android hosting project for Docxion. It brings together the `Docxion` Android library and its `Example` application in a single Gradle project.

Docxion is an Android document viewer built around a WebView-hosted TypeScript/JavaScript viewer. The Android library provides the native integration, while the Example application demonstrates and exercises that integration.

---

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Responsibilities](#responsibilities)
- [How the Android Project Fits Together](#how-the-android-project-fits-together)
- [Build and Run](#build-and-run)
- [Development Workflow](#development-workflow)
- [Viewer Asset Workflow](#viewer-asset-workflow)
- [Example Application](#example-application)
- [Building the Library](#building-the-library)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Related Documentation](#related-documentation)
- [License](#license)

---

## Overview

This directory is the **Android Gradle project** for Docxion.

It is not itself the Android library and it is not itself the Example application. Instead, it is the Android project that hosts both modules:

```text
Android Docxion Project
        |
        +-------------------+
        |                   |
        v                   v
    Docxion              Example
    Library              Application
```

The `Example` application depends on the sibling `Docxion` library module during development:

```groovy
implementation project(':Docxion')
```

This allows the example to build directly against the current library source.

---

## Project Structure

The Android project has the following structure:

```text
Docxion/
│
├── settings.gradle
├── build.gradle
├── gradle.properties
├── gradlew
├── gradlew.bat
│
├── Docxion/                  Android library module
│   ├── build.gradle
│   └── src/
│
└── Example/                  Example Android application
    ├── build.gradle
    ├── src/
    └── README.md
```

There may also be the usual Gradle and Android Studio generated files and directories.

The important distinction is:

- **This project/root** — hosts the Android modules.
- **`Docxion/`** — the reusable Android library.
- **`Example/`** — an Android application demonstrating the library.

The TypeScript viewer is developed separately in the `office-viewer` project and its generated distribution is consumed by the Android library.

---

## Responsibilities

### Android Project

The root project is responsible for:

- Defining the Gradle project.
- Including the `Docxion` and `Example` modules.
- Managing shared Gradle plugin versions.
- Providing the development/build environment for the Android side of Docxion.

It does not contain the viewer implementation itself.

### `Docxion` Library

The Android library provides:

- `DocxionViewer`
- `DocxionWebView`
- `DocxionWebViewApi`
- Android ↔ JavaScript communication
- WebView configuration
- Android file handling
- Viewer callbacks
- Jetpack Compose integration
- Bundled viewer assets

See [`Docxion/README.md`](Docxion/README.md) for the library-specific documentation.

### `Example` Application

The Example application provides a practical Android integration of the library.

It demonstrates:

- Embedding `DocxionViewer` in Jetpack Compose.
- Opening documents through Android's system document picker.
- Controlling the viewer through `DocxionWebViewApi`.
- Receiving `DocxionCallbacks`.
- Page navigation.
- Zoom and fit controls.
- Search navigation.
- Text selection.
- Theme switching.
- Printing.

See [`Example/README.md`](Example/README.md) for the application-specific documentation.

---

## How the Android Project Fits Together

The complete development relationship is:

```text
office-viewer
      |
      | npm run build
      v
TypeScript/JavaScript distribution
      |
      | copy generated files
      v
Docxion/src/main/assets/docxion/
      |
      v
Docxion Android Library
      |
      +----------------------+
      |                      |
      v                      v
Example Application       Other Android Apps
```

At runtime, the Android side hosts the TypeScript viewer in a WebView:

```text
Example Application
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
Android shell
        |
        v
TypeScript Viewer
```

The Android API and callback bridge connect the two sides:

```text
Android
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

and:

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
Android
```

The Example application communicates with the viewer through the public Kotlin API and callback interfaces exposed by the `Docxion` library. It does not communicate with the TypeScript viewer directly.

---

## Build and Run

Open the **Android project root** in Android Studio:

```text
Docxion/
```

This is the Gradle project containing both the library and the Example application.

### Build the Example APK

From the project root:

```bash
./gradlew :Example:assembleDebug
```

### Install the Example

With a connected Android device or emulator:

```bash
./gradlew :Example:installDebug
```

You can also select the `Example` run configuration in Android Studio and run it directly.

### Build the Library

To build the Android library:

```bash
./gradlew :Docxion:build
```

The `Docxion` module is a library and is not run as an application.

---

## Development Workflow

The normal Android development workflow is:

```text
1. Develop office-viewer
          |
          v
2. Build the TypeScript viewer
          |
          v
3. Copy the generated distribution
          |
          v
4. Prepare Docxion Android assets
          |
          v
5. Build Docxion
          |
          v
6. Run Example
          |
          v
7. Test the Android integration
```

The Example application is therefore both a usage example and a practical integration environment for the Android library.

---

## Viewer Asset Workflow

The Android library currently uses a manually prepared build of the TypeScript viewer.

From the `office-viewer` project:

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

The Android library also contains its WebView shell files:

```text
Docxion/src/main/assets/docxion/
├── index.html
├── index.css
└── index.js
```

The shell is **not part of the generated TypeScript `dist/` by default**. The generated distribution is copied into the Android assets alongside the existing shell.

Conceptually:

```text
Android assets
    =
Android WebView shell
    +
TypeScript viewer distribution
```

You do not need to recreate the shell when preparing a new viewer build. Build the TypeScript viewer, copy its generated distribution into the library assets, and build the Android project.

The current asset preparation step is manual. An automation script for this workflow is planned for a future development stage.

---

## Example Application

The Example module is a consumer of the local `Docxion` library:

```groovy
dependencies {
    implementation project(':Docxion')
}
```

A simplified integration looks like:

```kotlin
DocxionViewer(
    callbacks = callbacks,
    onApiCreated = { api = it }
)
```

The application can then control the viewer through `DocxionWebViewApi`:

```kotlin
api?.zoomIn()
api?.fitToWidth()
api?.goToNextMatch()
api?.setTheme("dark")
```

Viewer events are received through `DocxionCallbacks`, including text-selection geometry:

```kotlin
override fun onTextSelected(selection: TextSelection?) {
    Log.d("Docxion", "Text selection: $selection")
}
```

The complete Example documentation is available in [`Example/README.md`](Example/README.md).

---

## Building the Library

The library can be built independently from the root project:

```bash
./gradlew :Docxion:build
```

However, when changing the TypeScript viewer, the viewer distribution must first be rebuilt and copied into the Android library assets.

The complete relationship is:

```text
office-viewer
      |
      | build
      v
dist/
      |
      | copy
      v
Docxion/src/main/assets/docxion/
      |
      | Android build
      v
Docxion library
```

This separation keeps the TypeScript viewer and Android hosting layer independently developed while allowing the Android project to package the final viewer assets.

---

## Architecture

Docxion is divided into three principal layers:

```text
+---------------------------------------------+
|              Example Application            |
|          Jetpack Compose / Android           |
+-------------------------+-------------------+
                          |
                          v
+---------------------------------------------+
|              Docxion Android Library         |
|                                             |
|  DocxionViewer                              |
|  DocxionWebView                             |
|  DocxionWebViewApi                          |
|  JavaScript bridge                          |
|  Android file handling                      |
+-------------------------+-------------------+
                          |
                          v
+---------------------------------------------+
|             WebView / Android Shell          |
|                                             |
|  index.html / index.css / index.js          |
+-------------------------+-------------------+
                          |
                          v
+---------------------------------------------+
|            TypeScript / JavaScript Viewer    |
|                 office-viewer                |
+-------------------------+-------------------+
                          |
                          v
+---------------------------------------------+
|            Underlying File Viewer             |
|      Document rendering / format support     |
+---------------------------------------------+
```

The Android project therefore provides the native hosting environment rather than reimplementing document rendering.

---

## Requirements

For Android development, you need:

- Android Studio.
- Android SDK configured for the project.
- A connected Android device or available emulator for running the Example.
- Node.js and npm when rebuilding the TypeScript viewer.
- The required viewer distribution prepared in the `Docxion` Android library assets.

The exact Android SDK, Gradle, Android Gradle Plugin, Kotlin, and Node.js versions are determined by the project configuration.

---

## Related Documentation

- [`Docxion/README.md`](Docxion/README.md) — Android library documentation.
- [`Example/README.md`](Example/README.md) — Example application documentation.
- `office-viewer` — TypeScript/JavaScript viewer project.

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
