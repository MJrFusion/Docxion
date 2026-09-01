# office-viewer

> Project Status: Early Development
>
> This React/TypeScript viewer package is currently in the early stages of development. APIs, packaging, and project structure may change as the project evolves.

`office-viewer` is the React/TypeScript-facing package for the document viewer. It mounts the underlying file viewer, wires in the Word, Spreadsheet, and Presentation renderers, and adapts the controller into the `ViewerAPI` used by the Android wrapper.

This package is focused on office/document viewing.

## Current Status

The package currently exposes a programmatic `mountViewer(container, options)` entry point rather than a React component. The bundled dev entrypoint under `src/dev/` shows the intended usage.

## Installation

Install the package dependencies from the `office-viewer` directory:

```bash
npm install
```

Build and run the local dev entrypoint with:

```bash
npm run dev
```

Build the distributable bundle with:

```bash
npm run build
```

## Basic Usage

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

`mountViewer` returns a `ViewerAPI` with the current viewer controls:

- `openFile(file)`
- `closeFile()`
- `getCurrentFile()`
- `goToPage(page)`
- `getCurrentPage()`
- `getTotalPages()`
- `setZoom(zoom)`
- `getZoom()`
- `zoomIn(step?)`
- `zoomOut(step?)`
- `fitToWidth()`
- `fitToPage()`
- `search(query)`
- `clearSearch()`
- `goToNextMatch()`
- `goToPreviousMatch()`
- `getSelectedText()`
- `clearSelection()`
- `setTheme(theme)`
- `getTheme()`
- `print()`
- `destroy()`
- `isReady()`

## Configuration

The current `ViewerOptions` surface is small and explicit:

- `file?: File | string`
- `theme?: 'light' | 'dark'`
- `search?: { maxMatches?: number; caseSensitive?: boolean }`
- `presentation?: { pptWorkerUrl?: string; pptxWorkerUrl?: string }`
- `androidBridge?: AndroidCallbacks`

The dev setup uses the Vite plugin to copy renderer assets and sets presentation worker URLs for PowerPoint support.

## File Handling

The viewer accepts either a `File` or a string path through the controller adapter, but the host shell is responsible for loading the file and managing the current document.

The adapter does not keep a separate search history or page state. It forwards control to the underlying viewer controller.

## Search

Search is enabled in the mounted viewer and returns normalized `SearchResult[]` values from the underlying controller response. The adapter also exposes `goToNextMatch()`, `goToPreviousMatch()`, and `clearSearch()`.

If the underlying controller does not support search navigation, those calls fail explicitly.

## Viewer Controls

The adapter forwards page navigation, zoom, fit-to-width, fit-to-page, theme updates, and printing to the underlying controller when the controller supports those operations.

`getSelectedText()` currently returns `null`, and `clearSelection()` is a no-op because the current controller does not expose a documented selection API.

## Relationship to Docxion

`office-viewer` is the TypeScript viewer layer used by the Android `Docxion` library. Android controls it through `window.docxionApi`, and Android events are received through `window.DocxionAndroid`.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](../LICENSE) file for details.
