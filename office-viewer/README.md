# office-viewer

> **Project Status: Early Development**
>
> `office-viewer` is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

`office-viewer` is a Vite/TypeScript web viewer wrapper used by the [Docxion](../docxion) Android library.

It mounts the underlying file viewer, connects the Word, Spreadsheet, and Presentation renderers, and exposes a small programmatic `ViewerAPI` for controlling documents.

## Features

* Microsoft Word, Excel, and PowerPoint document viewing
* Programmatic `ViewerAPI`
* Page navigation
* Zoom and fit controls
* Search and search navigation
* Text selection and selection coordinates
* Light and dark themes
* Viewer capture
* Configurable capture aspect ratios
* Printing
* Android WebView bridge
* Configurable presentation workers

## Architecture

`office-viewer` sits between the underlying file viewer and the Docxion Android WebView integration:

```text
Application
    |
    v
office-viewer
    |
    v
Underlying File Viewer
    |
    +----------+-----------+-------------+
    |          |           |             |
    v          v           v             v
   Word   Spreadsheet  Presentation   Search
 Renderer   Renderer     Renderer
    |
    v
Android WebView
    |
    v
Docxion Android
```

The underlying file viewer handles document rendering and controller functionality. `office-viewer` adapts it into the public API used by browser-based development and the Android integration.

## Installation

From the `office-viewer` directory:

```bash
npm install
```

## Usage

Mount the viewer into an existing HTML element:

```ts
import { mountViewer, types } from './index';

const { CaptureAspectRatio, Theme } = types;

const viewer = await mountViewer(container, {
    file,

    theme: Theme.LIGHT,

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

`mountViewer()` returns a `ViewerAPI` instance.

## Viewer API

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

    setTheme(theme: Theme): void;
    getTheme(): Theme;

    capture(width: number, height: number): Promise<Uint8Array>;
    capture(height: number): Promise<Uint8Array>;
    capture(aspectRatio: CaptureAspectRatio): Promise<Uint8Array>;

    print(): void;
    destroy(): void;
    isReady(): boolean;
}
```

### Text Selection

Text selection is exposed through `TextSelection`.

A selection can span multiple lines and is represented by one or more visual rectangles:

```ts
interface TextSelection {
    rects: SelectionRect[];
}

interface SelectionRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
```

The Android bridge receives selection changes through:

```ts
onTextSelected(selection: TextSelection | null): void;
```

`null` indicates that there is no active text selection.

## Capture

The viewer provides a programmatic capture API for capturing the rendered viewer.

### Exact dimensions

Specify both width and height:

```ts
const image = await viewer.capture(1080, 1920);
```

Both dimensions are treated as exact capture dimensions in pixels.

### Full viewer width

Specify only the height to capture using the viewer's full width:

```ts
const image = await viewer.capture(1920);
```

### Aspect ratio

The viewer can calculate the capture height from the rendered viewer width and a supported aspect ratio:

```ts
const image = await viewer.capture(
    CaptureAspectRatio.RATIO_9_16,
);
```

Supported aspect ratios:

```ts
enum CaptureAspectRatio {
    RATIO_1_1 = '1:1',
    RATIO_16_9 = '16:9',
    RATIO_9_16 = '9:16',
    RATIO_4_3 = '4:3',
    RATIO_3_4 = '3:4',
    RATIO_3_2 = '3:2',
}
```

The capture methods return encoded image bytes as a `Uint8Array`.

## Configuration

```ts
interface ViewerOptions {
    file?: File | string;

    theme?: Theme;

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

`file` specifies the initial document.

```ts
file?: File | string;
```

The viewer accepts either a browser `File` or a string source.

### Theme

Themes are represented by the `Theme` enum:

```ts
enum Theme {
    LIGHT = 'light',
    DARK = 'dark',
}
```

Example:

```ts
theme: Theme.DARK
```

### Search

Search can be configured through:

```ts
search?: {
    maxMatches?: number;
    caseSensitive?: boolean;
};
```

`maxMatches` limits the number of returned matches.

`caseSensitive` controls whether search matching is case-sensitive.

### Presentation

PowerPoint rendering uses configurable worker URLs:

```ts
presentation?: {
    pptWorkerUrl?: string;
    pptxWorkerUrl?: string;
};
```

The Vite development setup provides the renderer assets and worker URLs required for PowerPoint support.

### Android Bridge

When hosted by Docxion, Android callbacks can be supplied through:

```ts
androidBridge?: AndroidCallbacks;
```

The bridge interface is:

```ts
interface AndroidCallbacks {
    log(message: string): void;

    onPageChanged(
        page: number,
        totalPages: number,
    ): void;

    onZoomChanged(zoom: number): void;

    onTextSelected(
        selection: TextSelection | null,
    ): void;

    onReady(timestamp: number): void;

    onError(
        message: string,
        code?: string,
    ): void;
}
```

## File Handling

The viewer accepts a `File` or string source:

```ts
openFile(file: File | string): Promise<void>;
```

The host is responsible for providing the document source.

When used by Docxion, the Android WebView integration provides the document to the JavaScript viewer.

## Search

Search is available through the `ViewerAPI`:

```ts
const results = await viewer.search(query);

await viewer.goToNextMatch();
await viewer.goToPreviousMatch();

viewer.clearSearch();
```

Search results are returned as `SearchResult[]`:

```ts
interface SearchResult {
    pageIndex: number;
    text: string;
    rect: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}
```

The adapter starts or replaces the active search in the underlying viewer.

Search navigation is owned by the underlying viewer. The adapter does not retain the returned matches.

If the underlying controller cannot perform a requested search operation, the API fails explicitly.

## Android Integration

When hosted by Docxion, the viewer communicates with Android through a JavaScript bridge:

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

* Page changes
* Zoom changes
* Text selection
* Viewer readiness
* Viewer errors
* Debug messages

Android consumes these events through its `DocxionCallbacks` interface.

The JavaScript API is exposed to Android as:

```ts
window.docxionApi
```

## Supported Formats

| Format               | Extension |
| -------------------- | --------- |
| Microsoft Word       | `.doc`    |
| Microsoft Word       | `.docx`   |
| Microsoft Excel      | `.xls`    |
| Microsoft Excel      | `.xlsx`   |
| Microsoft PowerPoint | `.ppt`    |
| Microsoft PowerPoint | `.pptx`   |

Format support is provided by the underlying file viewer and its document renderers.

## Development

Start the Vite development environment:

```bash
npm run dev
```

The development entrypoint under `src/dev/` provides a local environment for testing the viewer independently from the Android library.

## Building

Build the distributable bundle:

```bash
npm run build
```

The resulting JavaScript bundle is consumed by the Docxion Android WebView integration.

## Project Structure

```text
office-viewer/
├── src/
│   ├── dev/              Development entrypoint
│   └── ...               Viewer wrapper and API
├── package.json
├── vite.config.*
└── README.md
```

The internal structure may change as the project develops.

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

See the License for the specific language governing permissions
and limitations under the License.
```

Based on the underlying file viewer and its document renderers.
