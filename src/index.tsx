import { defineFileViewerElement } from '@file-viewer/web';
import { pdfRenderer } from '@file-viewer/renderer-pdf';
import { wordRenderer } from '@file-viewer/renderer-word';
import { spreadsheetRenderer } from '@file-viewer/renderer-spreadsheet';
import { presentationRenderer } from '@file-viewer/renderer-presentation';
import type {
  ViewerOptions,
  ViewerAPI,
  ViewerEvent,
  HighlightDetail,
  SearchResult,
} from './types/core';

// Define the web component
defineFileViewerElement();

// Internal class to manage viewer instance
class ViewerInstance implements ViewerAPI {
  private element: any;
  private container: HTMLElement;
  private ready: boolean = false;
  private eventCallback?: (event: ViewerEvent) => void;

  constructor(container: HTMLElement, options: ViewerOptions) {
    this.container = container;
    this.eventCallback = options.onEvent;

    // Create the web component
    this.element = document.createElement('flyfish-file-viewer');

    // Configure - NO TOOLBAR, NO UI CHROME
    this.element.options = {
      renderers: options.renderers || [
        pdfRenderer,
        wordRenderer,
        spreadsheetRenderer,
        presentationRenderer,
      ],
      rendererMode: options.rendererMode || 'replace',
      theme: options.theme || 'light',
      toolbar: false,
      sidebar: false,
      search: {
        enabled: true,
        maxMatches: options.search?.maxMatches || 1000,
        caseSensitive: options.search?.caseSensitive || false,
      },
      pdf: {
        toolbar: false,
        navigation: options.pdf?.navigation || true,
        defaultNavigationVisible: false,
      },
      ui: {
        toolbar: false,
        sidebar: false,
        navigation: false,
        searchBar: false,
        zoomControls: false,
        pageControls: false,
      },
    };

    if (options.file) {
      this.element.file = options.file;
    }

    container.innerHTML = '';
    container.appendChild(this.element);

    this.ready = true;
    this.emitEvent({ type: 'ready', detail: { timestamp: Date.now() } });
  }

  private emitEvent(event: ViewerEvent): void {
    if (this.eventCallback) {
      this.eventCallback(event);
    }
  }

  // ============================================================
  //  FILE OPERATIONS
  // ============================================================

  async openFile(file: File | string): Promise<void> {
    this.element.file = file;
    this.emitEvent({ type: 'ready', detail: { timestamp: Date.now() } });
  }

  closeFile(): void {
    this.element.file = null;
  }

  getCurrentFile(): File | string | null {
    return this.element.file || null;
  }

  // ============================================================
  //  NAVIGATION
  // ============================================================

  async goToPage(page: number): Promise<void> {
    if (this.element.goToPage) {
      await this.element.goToPage(page);
    }
  }

  getCurrentPage(): number {
    return this.element.currentPage || 0;
  }

  getTotalPages(): number {
    return this.element.totalPages || 0;
  }

  // ============================================================
  //  ZOOM
  // ============================================================

  async setZoom(zoom: number): Promise<void> {
    if (this.element.setZoom) {
      await this.element.setZoom(zoom);
      this.emitEvent({
        type: 'zoom-change',
        detail: { zoom },
      });
    }
  }

  getZoom(): number {
    return this.element.zoom || 1;
  }

  async zoomIn(step: number = 0.1): Promise<void> {
    const current = this.getZoom();
    await this.setZoom(current + step);
  }

  async zoomOut(step: number = 0.1): Promise<void> {
    const current = this.getZoom();
    await this.setZoom(Math.max(0.1, current - step));
  }

  async fitToWidth(): Promise<void> {
    if (this.element.fitToWidth) {
      await this.element.fitToWidth();
    }
  }

  async fitToPage(): Promise<void> {
    if (this.element.fitToPage) {
      await this.element.fitToPage();
    }
  }

  // ============================================================
  //  SEARCH
  // ============================================================

  async search(query: string): Promise<SearchResult[]> {
    if (this.element.search) {
      return await this.element.search(query);
    }
    return [];
  }

  clearSearch(): void {
    if (this.element.clearSearch) {
      this.element.clearSearch();
    }
  }

  async goToNextMatch(): Promise<void> {
    if (this.element.goToNextMatch) {
      await this.element.goToNextMatch();
    }
  }

  async goToPreviousMatch(): Promise<void> {
    if (this.element.goToPreviousMatch) {
      await this.element.goToPreviousMatch();
    }
  }

  // ============================================================
  //  HIGHLIGHTS
  // ============================================================

  async addHighlight(
    pageIndex: number,
    rect: { left: number; top: number; right: number; bottom: number },
    color: number
  ): Promise<HighlightDetail> {
    if (this.element.addHighlight) {
      const result = await this.element.addHighlight(pageIndex, rect, color);
      const detail: HighlightDetail = {
        pageIndex,
        rect,
        color,
        text: result.text || '',
      };
      this.emitEvent({ type: 'highlight', detail });
      return detail;
    }
    throw new Error('addHighlight not supported');
  }

  async removeHighlight(highlightId: number): Promise<void> {
    if (this.element.removeHighlight) {
      await this.element.removeHighlight(highlightId);
      this.emitEvent({
        type: 'removeHighlight',
        detail: { highlightId },
      });
    }
  }

  async changeHighlightColor(highlightId: number, newColor: number): Promise<void> {
    if (this.element.changeHighlightColor) {
      await this.element.changeHighlightColor(highlightId, newColor);
      this.emitEvent({
        type: 'changeColor',
        detail: { highlightId, page: this.getCurrentPage(), newColor },
      });
    }
  }

  getHighlights(): HighlightDetail[] {
    return this.element.getHighlights?.() || [];
  }

  // ============================================================
  //  SELECTION
  // ============================================================

  getSelectedText(): string | null {
    return this.element.getSelectedText?.() || null;
  }

  clearSelection(): void {
    if (this.element.clearSelection) {
      this.element.clearSelection();
    }
  }

  // ============================================================
  //  THEME
  // ============================================================

  setTheme(theme: 'light' | 'dark'): void {
    this.element.options.theme = theme;
    if (this.element.setTheme) {
      this.element.setTheme(theme);
    }
  }

  getTheme(): 'light' | 'dark' {
    return this.element.options?.theme || 'light';
  }

  // ============================================================
  //  PRINT
  // ============================================================

  print(): void {
    if (this.element.print) {
      this.element.print();
    }
  }

  // ============================================================
  //  LIFECYCLE
  // ============================================================

  destroy(): void {
    if (this.element.destroy) {
      this.element.destroy();
    }
    this.container.innerHTML = '';
    this.ready = false;
  }

  isReady(): boolean {
    return this.ready;
  }
}

// Export mount function
export function mountViewer(
  container: HTMLElement,
  options: ViewerOptions
): ViewerAPI {
  return new ViewerInstance(container, options);
}

export default {
  mountViewer,
};