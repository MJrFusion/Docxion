# office-viewer

> **Project Status: Early Development**
>
> `office-viewer` is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

`office-viewer` is a Vite/TypeScript wrapper around the underlying file viewer.

It provides the web-based viewer layer used by the Docxion Android library. The package mounts the underlying file viewer, connects the Word, Spreadsheet, and Presentation renderers, and exposes a small programmatic `ViewerAPI` for controlling documents.

The package is focused on Microsoft Office and document viewing.

## Table of Contents

- [Overview](#overview)
- [Current Status](#current-status)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Basic Usage](#basic-usage)
- [Viewer API](#viewer-api)
- [Configuration](#configuration)
- [File Handling](#file-handling)
- [Search](#search)
- [Viewer Controls](#viewer-controls)
- [Android Bridge](#android-bridge)
- [Relationship to Docxion](#relationship-to-docxion)
- [Supported Documents](#supported-documents)
- [Project Scope](#project-scope)
- [License](#license)

## Overview

`office-viewer` provides the TypeScript/JavaScript viewer layer used by the Docxion Android library.

The package sits between the underlying file viewer and the Android WebView integration:

```text
Underlying File Viewer
        |
        v
office-viewer
        |
        +--------------------+
        |                    |
        v                    v
   ViewerAPI          Android Bridge
        |                    |
        v                    v
TypeScript Host       Docxion Android
```

The underlying file viewer is responsible for document rendering and controller functionality.

`office-viewer` adapts that functionality into a small, explicit API focused on office/document viewing.

## Current Status

The package currently exposes a programmatic:

```ts
mountViewer(container, options)
```

entry point rather than a React component.

The development entrypoint under `src/dev/` demonstrates the intended usage and provides a local environment for testing the viewer.

The public viewer API is intentionally kept small and close to the underlying controller.

## Project Structure

The package is organized around the viewer wrapper, development entrypoint, and renderer integration.

A simplified structure is:

```text
office-viewer/
│
├── src/
│   ├── dev/              Vite development entrypoint
│   ├── ...               Viewer wrapper and API implementation
│   └── ...
│
├── package.json          Package scripts and dependencies
├── vite.config.*         Vite configuration
└── README.md             Package documentation
```

The exact source structure may evolve as the package develops.

## Architecture

`office-viewer` adapts the underlying file viewer controller into the public `ViewerAPI`.

```text
Application
    |
    v
mountViewer(container, options)
    |
    v
office-viewer
    |
    v
Underlying File Viewer Controller
    |
    +----------+-----------+-------------+
    |          |           |             |
    v          v           v             v
   Word   Spreadsheet  Presentation   Search
 Renderer   Renderer     Renderer
```

The wrapper does not reimplement document rendering.

Instead, it:

- Mounts the underlying viewer.
- Connects office document renderers.
- Adapts controller operations.
- Normalizes the public API.
- Provides search configuration.
- Provides presentation worker configuration.
- Connects Android callbacks when supplied.

## Installation

From the `office-viewer` directory, install the package dependencies:

```bash
npm install
```

## Development

Start the Vite development environment with:

```bash
npm run dev
```

The development entrypoint under `src/dev/` demonstrates how the viewer is mounted and configured.

It can be used to develop and test the viewer independently from the Android library.

## Building

Build the distributable bundle with:

```bash
npm run build
```

The resulting bundle is used by the Android integration as the JavaScript viewer layer hosted inside the WebView.

## Basic Usage

The viewer is mounted programmatically into an existing HTML element:

```ts
import { mountViewer } from './index';

const viewer = await mountViewer(container, {
    file,
    theme: 'light',
    search: {
        maxMatches: 1000,
        caseSensitive: false,
    },
    presentation: {
        pptWorkerUrl,
        pptxWorkerUrl,
    },
});
```

`mountViewer()` returns a `ViewerAPI` instance that can be used to control the mounted viewer.

## Viewer API

The current `ViewerAPI` exposes:

```ts
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

The API is designed to provide the operations required by the Android Docxion wrapper while remaining useful for browser-based development and testing.

## Configuration

The current `ViewerOptions` surface is intentionally small and explicit:

```ts
interface ViewerOptions {
    file?: File | string;

    theme?: 'light' | 'dark';

    search?: {
        maxMatches?: number;
        caseSensitive?: boolean;
    };

    presentation?: {
        pptWorkerUrl?: string;
        pptxWorkerUrl?: string;
    };

    androidBridge?: AndroidCallbacks;
}
```

### File

The optional `file` value specifies the initial document:

```ts
file?: File | string;
```

### Theme

The viewer supports light and dark themes:

```ts
theme?: 'light' | 'dark';
```

### Search

Search behavior can be configured through:

```ts
search?: {
    maxMatches?: number;
    caseSensitive?: boolean;
};
```

### Presentation

PowerPoint rendering can be configured with worker URLs:

```ts
presentation?: {
    pptWorkerUrl?: string;
    pptxWorkerUrl?: string;
};
```

The development setup uses the Vite configuration to copy renderer assets and provide the presentation worker URLs required for PowerPoint support.

### Android Bridge

When the viewer is hosted by the Android Docxion library, Android callbacks can be supplied through:

```ts
androidBridge?: AndroidCallbacks;
```

This allows the viewer to report events back to the Android host.

## File Handling

The viewer accepts either a `File` or a string path through the controller adapter:

```ts
openFile(file: File | string): Promise<void>;
```

The host environment is responsible for obtaining the file and managing the document source.

The adapter does not maintain a separate document state model. It forwards file and viewer operations to the underlying viewer controller.

When used from Android, the Docxion WebView layer provides the file to the JavaScript viewer through the Android WebView asset-loading mechanism.

## Search

Search is exposed through the viewer API:

```ts
const results = await viewer.search(query);
```

Search results are normalized into `SearchResult[]` values from the underlying controller response.

The viewer also exposes:

```ts
viewer.goToNextMatch();
viewer.goToPreviousMatch();
viewer.clearSearch();
```

If the underlying controller does not support search navigation, the corresponding navigation calls fail explicitly rather than silently doing nothing.

## Viewer Controls

The wrapper forwards supported operations to the underlying controller.

These include:

- Page navigation
- Zoom
- Fit to width
- Fit to page
- Theme updates
- Printing
- Search
- Search match navigation
- File opening and closing

The wrapper intentionally keeps these operations close to the underlying viewer rather than introducing a separate state-management layer.

### Text Selection

The public API includes:

```ts
getSelectedText(): string | null;
clearSelection(): void;
```

At the current stage, `getSelectedText()` returns `null` and `clearSelection()` is a no-op because the underlying controller does not expose a documented selection API.

These methods remain part of the public API so the Android-facing contract can stay consistent.

## Android Bridge

When hosted by Docxion, `office-viewer` communicates with Android through a JavaScript bridge.

The communication boundary is:

```text
TypeScript Viewer
       |
       v
AndroidCallbacks
       |
       v
window.DocxionAndroid
       |
       v
Android WebView
       |
       v
DocxionJsBridge
```

The bridge can report:

- Page changes
- Zoom changes
- Text selection
- Viewer readiness
- Viewer errors
- Debug log messages

The Android library consumes these events through its `DocxionCallbacks` interface.

## Relationship to Docxion

`office-viewer` is the TypeScript/JavaScript viewer layer used by the Android `Docxion` library.

The relationship is:

```text
office-viewer
     |
     v
Built JavaScript Bundle
     |
     v
Android WebView
     |
     v
Docxion Android Library
     |
     v
Jetpack Compose Application
```

Android controls the viewer through the JavaScript API exposed as:

```ts
window.docxionApi
```

Viewer events are sent back to Android through:

```ts
window.DocxionAndroid
```

This separation keeps document viewing in the TypeScript/JavaScript layer while the Android library focuses on WebView integration and the native Kotlin/Compose API.

## Supported Documents

The package is focused on Microsoft Office document viewing.

The intended document formats include:

| Format | Extension |
|---|---|
| Microsoft Word | `.doc` |
| Microsoft Word | `.docx` |
| Microsoft Excel | `.xls` |
| Microsoft Excel | `.xlsx` |
| Microsoft PowerPoint | `.ppt` |
| Microsoft PowerPoint | `.pptx` |

Actual format support is provided by the underlying file viewer and its connected document renderers.

## Project Scope

`office-viewer` is intentionally focused on adapting the underlying file viewer for office/document viewing.

Its main responsibilities are:

1. Mount the underlying file viewer.
2. Connect the office document renderers.
3. Expose a small `ViewerAPI`.
4. Adapt viewer configuration.
5. Provide the Android callback bridge.
6. Produce the JavaScript bundle consumed by the Android WebView.

The package does not attempt to replace the underlying document rendering engine.

As development continues, APIs and internal structure may change.

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
