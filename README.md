# Docxion
[![CI](https://github.com/MJrFusion/Docxion/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/MJrFusion/Docxion/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/MJrFusion/Docxion?display_name=tag&sort=semver)](https://github.com/MJrFusion/Docxion/releases/latest)

> **Project Status: Early Development**
>
> Docxion is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

Docxion is an open-source Android Jetpack Compose library for viewing Microsoft Office documents.

It supports:

- DOC
- DOCX
- XLS
- XLSX
- PPT
- PPTX

Docxion embeds a TypeScript/JavaScript document viewer inside an Android WebView and exposes a native Kotlin API for controlling it.

## Demo

<div align="center">
  <video
    src="https://github.com/user-attachments/assets/323f9488-f0e6-4ad1-add6-1a25bc58f8b9"
    controls
    width="471">
  </video>
</div>

## Installation

Add JitPack to your repositories.

### `settings.gradle`

```groovy
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)

    repositories {
        google()
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}
```

### `settings.gradle.kts`

```kotlin
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)

    repositories {
        google()
        mavenCentral()
        maven("https://jitpack.io")
    }
}
```

Add Docxion:

### Groovy

```groovy
dependencies {
    implementation 'com.github.MJrFusion:Docxion:<version>'
}
```

### Kotlin DSL

```kotlin
dependencies {
    implementation("com.github.MJrFusion:Docxion:<version>")
}
```

See the repository releases and tags for available versions.

## Usage

Embed the viewer in a Jetpack Compose UI:

```kotlin
DocxionViewer(
    modifier = Modifier.fillMaxSize(),
    callbacks = callbacks,
    onApiCreated = { api ->
        // Keep the API reference for viewer operations.
    }
)
```

The returned `DocxionWebViewApi` can be used to control the viewer:

```kotlin
api?.openFile(uri)
```

It provides operations for:

- Opening and closing documents
- Page navigation
- Zoom
- Fit-to-width and fit-to-page
- Search
- Text selection
- Themes
- Printing
- Viewer lifecycle

## Supported Documents

| Type | Formats |
|---|---|
| Microsoft Word | `.doc`, `.docx` |
| Microsoft Excel | `.xls`, `.xlsx` |
| Microsoft PowerPoint | `.ppt`, `.pptx` |

Actual format support depends on the document renderers included in the viewer.

## Project Structure

```text
Docxion/
├── Docxion/         Android / Jetpack Compose library
├── office-viewer/   TypeScript / React viewer
├── Example/         Example Android application
├── assets/          Repository assets
└── README.md
```

### Docxion Android Library

The Android library provides the native Jetpack Compose integration, WebView integration, JavaScript bridge, document loading, viewer API, and callbacks.

[Read the Android library documentation](Docxion/README.md)

### office-viewer

The TypeScript/React package contains the underlying document viewer used by the Android library.

[Read the office-viewer documentation](office-viewer/README.md)

### Example

The example application demonstrates Docxion integration in an Android application.

[Read the Example documentation](Example/README.md)

## Architecture

Docxion uses a WebView as the boundary between the Android and JavaScript implementations:

```text
Android Application
        |
        v
Docxion Android Library
        |
        v
Android WebView
        |
        v
TypeScript / JavaScript Viewer
        |
        v
Document Renderers
```

The Android library exposes a Kotlin API while the underlying viewer handles document viewing and rendering.

## Development

The repository contains the Android library, the underlying TypeScript viewer, and an example application.

See the README in each component for development instructions.

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
