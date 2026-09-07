# office-viewer

> **Project Status: Early Development**
>
> `office-viewer` is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

`office-viewer` is a Vite/TypeScript web viewer wrapper used by the [Docxion](../docxion) Android library.

It mounts the underlying file viewer, connects the Word, Spreadsheet, and Presentation renderers, and exposes a small programmatic `ViewerAPI` for controlling documents.

## Features

- Microsoft Word, Excel, and PowerPoint document viewing
- Programmatic `ViewerAPI`
- Page navigation
- Zoom and fit controls
- Search and search navigation
- Light and dark themes
- Printing
- Android WebView bridge
- Configurable presentation workers

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

    setTheme(theme: 'light' | 'dark'): void;
    getTheme(): 'light' | 'dark';

    print(): void;
    destroy(): void;
    isReady(): boolean;
}
```

### Text Selection

`getSelectedText()` currently returns `null` and `clearSelection()` is a no-op because the underlying controller does not expose a documented selection API.

The methods remain part of the public API for compatibility with the Android-facing contract.

## Configuration

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

`file` specifies the initial document.

```ts
file?: File | string;
```

### Theme

```ts
theme?: 'light' | 'dark';
```

### Search

```ts
search?: {
    maxMatches?: number;
    caseSensitive?: boolean;
};
```

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

viewer.goToNextMatch();
viewer.goToPreviousMatch();
viewer.clearSearch();
```

Search results are returned as `SearchResult[]`.

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

- Page changes
- Zoom changes
- Text selection
- Viewer readiness
- Viewer errors
- Debug messages

Android consumes these events through its `DocxionCallbacks` interface.

The JavaScript API is exposed to Android as:

```ts
window.docxionApi
```

## Supported Formats

| Format | Extension |
|---|---|
| Microsoft Word | `.doc` |
| Microsoft Word | `.docx` |
| Microsoft Excel | `.xls` |
| Microsoft Excel | `.xlsx` |
| Microsoft PowerPoint | `.ppt` |
| Microsoft PowerPoint | `.pptx` |

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
