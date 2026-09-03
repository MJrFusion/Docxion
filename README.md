# Docxion

> **Project Status: Early Development**
>
> Docxion is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

Docxion is an open-source Android Jetpack Compose library for viewing Microsoft Office documents, including DOC, DOCX, XLS, XLSX, PPT, and PPTX.

The Android library embeds the underlying TypeScript/JavaScript document viewer inside an Android WebView and exposes a native Kotlin API for controlling the viewer.

The repository contains three main parts:

- [Docxion Android Library](Docxion/README.md) — Android/Jetpack Compose library
- [office-viewer](office-viewer/README.md) — React/TypeScript viewer package
- [Example](Example/README.md) — Example Android application

---

## Table of Contents

- [Docxion](#docxion)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Installation](#installation)
    - [Add the JitPack repository](#add-the-jitpack-repository)
    - [Add Docxion](#add-docxion)
    - [Sync Gradle](#sync-gradle)
  - [Project Structure](#project-structure)
  - [Architecture](#architecture)
    - [Android to JavaScript](#android-to-javascript)
    - [JavaScript to Android](#javascript-to-android)
  - [Components](#components)
    - [Docxion Android Library](#docxion-android-library)
    - [office-viewer](#office-viewer)
    - [Example](#example)
  - [Supported Documents](#supported-documents)
  - [Android Integration](#android-integration)
  - [Viewer API](#viewer-api)
  - [Callbacks](#callbacks)
  - [Getting Started](#getting-started)
  - [Repository Development](#repository-development)
    - [Android Library](#android-library)
    - [TypeScript Viewer](#typescript-viewer)
    - [Example Application](#example-application)
  - [Project Scope](#project-scope)
  - [License](#license)

---

## Overview

Docxion provides an Android integration for a web-based document viewer.

The underlying viewer is implemented in TypeScript/JavaScript, while the Android library provides a Jetpack Compose-friendly interface for embedding and controlling it.

At a high level:

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

The Android library provides a native Kotlin API while keeping the document rendering and viewer functionality in the underlying TypeScript/JavaScript implementation.

---

## Installation

Docxion is distributed through [JitPack](https://jitpack.io/).

### Add the JitPack repository

In the consuming Android project's `settings.gradle`:

```groovy
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)

    repositories {
        google()
        mavenCentral()
        maven { url = uri('https://jitpack.io') }
    }
}
```

For `settings.gradle.kts`:

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

### Add Docxion

For Groovy:

```groovy
dependencies {
    implementation 'com.github.mjrfusion:docxion:1.0.0-alpha.1'
}
```

For Kotlin DSL:

```kotlin
dependencies {
    implementation("com.github.mjrfusion:docxion:1.0.0-alpha.1")
}
```

> **Note:** `1.0.0-alpha.1` is the first public alpha release of Docxion. The API and implementation may change in future alpha releases.

### Sync Gradle

Sync the project after adding the repository and dependency. Gradle will retrieve Docxion from JitPack.

For installation, configuration, API details, and Android usage, see [the Docxion Android Library documentation](Docxion/README.md).

---

## Project Structure

The repository contains three primary components:

```text
Docxion/
│
├── Docxion/         Android / Jetpack Compose library
│
├── office-viewer/   React / TypeScript viewer package
│
├── Example/         Example Android application
│
└── README.md        Repository documentation
```

Each component has its own README with implementation-specific documentation.

---

## Architecture

The project uses a WebView as the boundary between the Android and TypeScript implementations.

### Android to JavaScript

Android applications control the viewer through `DocxionWebViewApi`.

```text
Kotlin
  |
  v
DocxionWebViewApi
  |
  v
WebView.evaluateJavascript()
  |
  v
window.docxionApi
  |
  v
ViewerAPI
  |
  v
Document Viewer
```

`DocxionWebViewApi` mirrors the public TypeScript `ViewerAPI`, allowing Kotlin code to perform operations such as:

- Open documents
- Close documents
- Navigate pages
- Change zoom
- Fit documents to width or page
- Search documents
- Navigate search matches
- Read selected text
- Change themes
- Print
- Destroy the viewer
- Check viewer readiness

### JavaScript to Android

Viewer events are sent back to Android through the JavaScript bridge.

```text
Document Viewer
      |
      v
AndroidCallbacks
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
Android Application
```

This allows Android applications to receive events such as:

- Page changes
- Zoom changes
- Text selection
- Viewer readiness
- Viewer errors
- Debug log messages

---

## Components

### Docxion Android Library

The `Docxion` module is the Android-facing library.

It provides:

- Jetpack Compose integration
- WebView configuration
- JavaScript bridge integration
- Local document loading
- URI-based document loading
- Kotlin access to the JavaScript viewer API
- Viewer callbacks

The main Compose entry point is:

```kotlin
DocxionViewer(
    modifier = Modifier.fillMaxSize(),
    callbacks = callbacks,
    onApiCreated = { api ->
        // Store the API for later viewer operations.
    }
)
```

The Kotlin viewer API is exposed through:

```kotlin
DocxionWebViewApi
```

The Android library uses the package:

```text
com.mjrfusion.docxion
```

For installation, configuration, API details, and Android usage:

[Read the Docxion Android Library documentation](Docxion/README.md)

---

### office-viewer

`office-viewer` is the React/TypeScript-facing viewer package.

It provides the underlying document viewing functionality used by the Android integration.

The viewer exposes a `ViewerAPI` through:

```typescript
mountViewer(
    container,
    options
)
```

The viewer provides document operations such as:

- Opening files
- Closing files
- Page navigation
- Zoom controls
- Document fitting
- Searching
- Search match navigation
- Text selection
- Themes
- Printing
- Viewer destruction
- Ready-state checking

The Android library hosts this viewer inside a WebView and communicates with it through the JavaScript API.

For TypeScript/React usage and configuration:

[Read the office-viewer documentation](office-viewer/README.md)

---

### Example

The `Example` module is an Android application demonstrating how to use the Docxion Android library.

It demonstrates:

- Embedding `DocxionViewer` in Jetpack Compose
- Receiving `DocxionWebViewApi`
- Registering viewer callbacks
- Opening documents
- Calling viewer operations
- Controlling navigation and zoom
- Interacting with the JavaScript viewer through Kotlin

For build instructions and practical integration examples:

[Read the Example application documentation](Example/README.md)

---

## Supported Documents

Docxion is focused primarily on Microsoft Office document viewing.

The project is intended to support the following Office formats:

| Format | Extension |
|---|---|
| Microsoft Word | `.doc` |
| Microsoft Word | `.docx` |
| Microsoft Excel | `.xls` |
| Microsoft Excel | `.xlsx` |
| Microsoft PowerPoint | `.ppt` |
| Microsoft PowerPoint | `.pptx` |

Actual format support depends on the document renderers included in the underlying viewer.

---

## Android Integration

A typical Android integration uses the Compose viewer:

```kotlin
DocxionViewer(
    modifier = Modifier.fillMaxSize(),
    callbacks = callbacks,
    onApiCreated = { api ->
        // Store the API for later viewer operations.
    }
)
```

Once the `DocxionWebViewApi` is available, the application can control the viewer.

For example:

```kotlin
api?.openFile(uri)
```

The Android API is intentionally kept close to the underlying TypeScript `ViewerAPI`.

For complete Android integration instructions:

[Docxion Android Library README](Docxion/README.md)

---

## Viewer API

The TypeScript viewer exposes the following general API surface:

```typescript
interface ViewerAPI {

    openFile(file: File | string): Promise<void>;

    closeFile(): void;

    getCurrentFile(): File | string | null;

    goToPage(page: number): Promise<void>;

    getCurrentPage(): number;

    getTotalPages(): number;

    setZoom(zoom: number): Promise<void>;

    getZoom(): number;

    zoomIn(step?: number): Promise<void>;

    zoomOut(step?: number): Promise<void>;

    fitToWidth(): Promise<void>;

    fitToPage(): Promise<void>;

    search(query: string): Promise<SearchResult[]>;

    clearSearch(): void;

    goToNextMatch(): Promise<void>;

    goToPreviousMatch(): Promise<void>;

    getSelectedText(): string | null;

    clearSelection(): void;

    setTheme(theme: 'light' | 'dark'): void;

    getTheme(): 'light' | 'dark';

    print(): void;

    destroy(): void;

    isReady(): boolean;

}
```

The Android `DocxionWebViewApi` provides the corresponding Kotlin-facing operations.

---

## Callbacks

The viewer can send events back to the Android application.

The callback surface includes:

```typescript
interface AndroidCallbacks {

    log(message: string): void;

    onPageChanged(
        page: number,
        totalPages: number
    ): void;

    onZoomChanged(
        zoom: number
    ): void;

    onTextSelected(
        text: string | null
    ): void;

    onReady(
        timestamp: number
    ): void;

    onError(
        message: string,
        code?: string
    ): void;

}
```

On Android, these events are represented by `DocxionCallbacks`.

This keeps the Android callback API aligned with the TypeScript viewer.

---

## Getting Started

If you are using Docxion as an Android developer, start with the Android library documentation:

[Docxion Android Library](Docxion/README.md)

If you are working on the underlying TypeScript/React viewer:

[office-viewer](office-viewer/README.md)

If you want to see a complete Android integration:

[Example application](Example/README.md)

---

## Repository Development

When working on the repository, choose the component that corresponds to the part of the system you are changing.

### Android Library

For Android, Kotlin, Jetpack Compose, WebView, or Android bridge work:

```text
Docxion/
```

See:

[Docxion/README.md](Docxion/README.md)

### TypeScript Viewer

For viewer, rendering, React, TypeScript, or JavaScript work:

```text
office-viewer/
```

See:

office-viewer/README.md

### Example Application

For integration testing and Android usage examples:

```text
Example/
```

See:

[Example/README.md](Example/README.md)

---

## Project Scope

Docxion is intentionally kept relatively simple.

The project is built around three responsibilities:

1. The TypeScript viewer handles document viewing and rendering.
2. The Android library embeds and controls the viewer through a WebView.
3. The Example application demonstrates practical Android integration.

The Android layer does not reimplement the document rendering engine. Instead, it provides a native Android and Jetpack Compose integration around the existing JavaScript viewer.

The project structure, APIs, and packaging may evolve as development continues.

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
