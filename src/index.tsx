import { mountViewer as originalMountViewer } from '@file-viewer/web';
import { wordRenderer } from '@file-viewer/renderer-word';
import { spreadsheetRenderer } from '@file-viewer/renderer-spreadsheet';
import { presentationRenderer } from '@file-viewer/renderer-presentation';
import type { ViewerOptions, ViewerAPI, PageChangeDetail } from './types/core';

export async function mountViewer(
  container: HTMLElement,
  options: ViewerOptions
): Promise<ViewerAPI> {
  const originalOptions: any = {
    renderers: options.renderers || [
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
    onEvent: (nativeEvent: any) => {
      if (options.onEvent) {
        options.onEvent(nativeEvent);
      }
    },
  };

  const controller: any = await originalMountViewer(container, {
    file: options.file as any,
    options: originalOptions,
  });

  const element = container.querySelector('flyfish-file-viewer') as any;

  const extractZoom = (zoom: any): number => {
    if (zoom === null || zoom === undefined) return 1;
    if (typeof zoom === 'number') return zoom;
    if (typeof zoom === 'object' && zoom !== null && 'scale' in zoom) {
      return zoom.scale;
    }
    return 1;
  };

  const getViewState = () => {
    if (typeof controller.getViewState === 'function') {
      return controller.getViewState();
    }
    if (typeof controller.getState === 'function') {
      return controller.getState();
    }
    return {};
  };

  const extractPage = (state: any): number | undefined => {
    if (!state) return undefined;
    let page = state.page ?? state.currentPage ?? state.pageNumber ?? state.pageIndex;
    if (page !== undefined && page !== null) {
      if (state.pageIndex !== undefined) return page + 1;
      return page;
    }
    if (state.lastEvent) {
      const evt = state.lastEvent;
      page = evt.page ?? evt.currentPage ?? evt.pageNumber ?? evt.pageIndex;
      if (page !== undefined && page !== null) {
        if (evt.pageIndex !== undefined) return page + 1;
        return page;
      }
    }
    return undefined;
  };

  const extractTotalPages = (state: any): number => {
    if (!state) return 0;
    let total = state.totalPages ?? state.total ?? state.pageCount ?? state.numPages;
    if (total !== undefined && total !== null) return total;
    if (state.lastEvent) {
      const evt = state.lastEvent;
      total = evt.totalPages ?? evt.total ?? evt.pageCount ?? evt.numPages;
      if (total !== undefined && total !== null) return total;
    }
    if (element?.totalPages) return element.totalPages;
    if (element?.pageCount) return element.pageCount;
    return 0;
  };

  if (controller.subscribe) {
    controller.subscribe((state: any) => {
      try {
        const page = extractPage(state);
        const total = extractTotalPages(state);
        if (page !== undefined && page !== null && page > 0) {
          const detail: PageChangeDetail = { page, totalPages: total };
          options.onEvent?.({ type: 'pageChange', detail });
        }
        if (state?.zoom !== undefined && state?.zoom !== null) {
          const zoomVal = extractZoom(state.zoom);
          options.onEvent?.({ type: 'zoom-change', detail: { zoom: zoomVal } });
        }
      } catch (err) {
        console.warn('Error processing state update:', err);
      }
    });
  }

  const api: ViewerAPI = {
    async openFile(file: File | string): Promise<void> {
      element.file = file;
    },
    closeFile(): void {
      element.file = null;
    },
    getCurrentFile(): File | string | null {
      return element.file || null;
    },

    async goToPage(page: number): Promise<void> {
      await controller.applyViewState({ page });
    },
    getCurrentPage(): number {
      const state = getViewState();
      const page = extractPage(state);
      return page ?? 0;
    },
    getTotalPages(): number {
      const state = getViewState();
      return extractTotalPages(state);
    },

    async setZoom(zoom: number): Promise<void> {
      await controller.applyViewState({ zoom });
    },
    getZoom(): number {
      const state = getViewState();
      return extractZoom(state?.zoom);
    },
    async zoomIn(step: number = 0.1): Promise<void> {
      if (typeof controller.zoomIn === 'function') {
        await controller.zoomIn();
      } else {
        const current = this.getZoom();
        await this.setZoom(Math.min(4, current + step));
      }
    },
    async zoomOut(step: number = 0.1): Promise<void> {
      if (typeof controller.zoomOut === 'function') {
        await controller.zoomOut();
      } else {
        const current = this.getZoom();
        await this.setZoom(Math.max(0.5, current - step));
      }
    },
    async fitToWidth(): Promise<void> {
      if (typeof controller.fitToView === 'function') {
        await controller.fitToView('width');
      } else if (typeof controller.fitToWidth === 'function') {
        await controller.fitToWidth();
      } else {
        await this.setZoom(1);
      }
    },
    async fitToPage(): Promise<void> {
      if (typeof controller.fitToView === 'function') {
        await controller.fitToView('page');
      } else if (typeof controller.fitToPage === 'function') {
        await controller.fitToPage();
      } else {
        await this.setZoom(1);
      }
    },

    async search(query: string): Promise<any[]> {
      if (typeof controller.searchDocument === 'function') {
        return await controller.searchDocument(query);
      }
      if (typeof controller.search === 'function') {
        return await controller.search(query);
      }
      return [];
    },
    clearSearch(): void {
      if (typeof controller.clearDocumentSearch === 'function') {
        controller.clearDocumentSearch();
      } else if (typeof controller.clearSearch === 'function') {
        controller.clearSearch();
      }
    },
    async goToNextMatch(): Promise<void> {
      if (typeof controller.nextSearchResult === 'function') {
        await controller.nextSearchResult();
      } else if (typeof controller.goToNextMatch === 'function') {
        await controller.goToNextMatch();
      }
    },
    async goToPreviousMatch(): Promise<void> {
      if (typeof controller.previousSearchResult === 'function') {
        await controller.previousSearchResult();
      } else if (typeof controller.goToPreviousMatch === 'function') {
        await controller.goToPreviousMatch();
      }
    },

    async addHighlight(pageIndex: number, rect: any, color: number): Promise<any> {
      if (typeof controller.addHighlight === 'function') {
        const result = await controller.addHighlight(pageIndex, rect, color);
        const detail = { pageIndex, rect, color, text: result.text || '' };
        if (options.onEvent) {
          options.onEvent({ type: 'highlight', detail });
        }
        return detail;
      }
      throw new Error('addHighlight not supported');
    },
    async removeHighlight(highlightId: number): Promise<void> {
      if (typeof controller.removeHighlight === 'function') {
        await controller.removeHighlight(highlightId);
        if (options.onEvent) {
          options.onEvent({ type: 'removeHighlight', detail: { highlightId } });
        }
      }
    },
    async changeHighlightColor(highlightId: number, newColor: number): Promise<void> {
      if (typeof controller.changeHighlightColor === 'function') {
        await controller.changeHighlightColor(highlightId, newColor);
        const page = this.getCurrentPage();
        if (options.onEvent) {
          options.onEvent({ type: 'changeColor', detail: { highlightId, page, newColor } });
        }
      }
    },
    getHighlights(): any[] {
      return controller.getHighlights?.() || [];
    },

    getSelectedText(): string | null {
      return controller.getSelectedText?.() || null;
    },
    clearSelection(): void {
      if (typeof controller.clearSelection === 'function') {
        controller.clearSelection();
      }
    },

    setTheme(theme: 'light' | 'dark'): void {
      if (element) {
        element.theme = theme;
        if (element.options) {
          element.options.theme = theme;
        }
      }
    },
    getTheme(): 'light' | 'dark' {
      return element?.theme || element?.options?.theme || 'light';
    },

    print(): void {
      if (typeof controller.printRenderedHtml === 'function') {
        controller.printRenderedHtml();
      } else if (typeof controller.print === 'function') {
        controller.print();
      }
    },

    destroy(): void {
      if (typeof controller.destroy === 'function') {
        controller.destroy();
      }
      container.innerHTML = '';
    },
    isReady(): boolean {
      return !!controller && !!element;
    },
  };

  return api;
}

export default { mountViewer };