// ============================================================
//  ANDROID BRIDGE
// ============================================================

export interface AndroidBridge {
  log(message: string): void;
  onPageChanged(page: number): void;
  createHighlight(
    pageIndex: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
    color: number
  ): void;
  changeHighlightColor(highlightId: number, newColor: number): void;
  removeHighlight(highlightId: number): void;
}

// ============================================================
//  VIEWER EVENTS
// ============================================================

export interface HighlightDetail {
  pageIndex: number;
  rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  color: number;
  text: string;
}

export interface PageChangeDetail {
  page: number;
  totalPages: number;
}

export interface ChangeColorDetail {
  highlightId: number;
  page: number;
  newColor: number;
}

export interface RemoveHighlightDetail {
  highlightId: number;
}

export interface ZoomChangeDetail {
  zoom: number;
}

export interface ErrorDetail {
  message: string;
  code?: string;
}

export type ViewerEvent =
  | { type: 'highlight'; detail: HighlightDetail }
  | { type: 'pageChange'; detail: PageChangeDetail }
  | { type: 'changeColor'; detail: ChangeColorDetail }
  | { type: 'removeHighlight'; detail: RemoveHighlightDetail }
  | { type: 'zoom-change'; detail: ZoomChangeDetail }
  | { type: 'error'; detail: ErrorDetail }
  | { type: 'ready'; detail: { timestamp: number } };

// ============================================================
//  VIEWER API
// ============================================================

export interface ViewerAPI {
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

  addHighlight(
    pageIndex: number,
    rect: { left: number; top: number; right: number; bottom: number },
    color: number
  ): Promise<HighlightDetail>;
  removeHighlight(highlightId: number): Promise<void>;
  changeHighlightColor(highlightId: number, newColor: number): Promise<void>;
  getHighlights(): HighlightDetail[];

  getSelectedText(): string | null;
  clearSelection(): void;

  setTheme(theme: 'light' | 'dark'): void;
  getTheme(): 'light' | 'dark';

  print(): void;

  destroy(): void;
  isReady(): boolean;
}

export interface SearchResult {
  pageIndex: number;
  text: string;
  rect: { left: number; top: number; right: number; bottom: number };
}

// ============================================================
//  VIEWER OPTIONS
// ============================================================

export interface ViewerOptions {
  file?: File | string;
  theme?: 'light' | 'dark';
  renderers?: any[];
  rendererMode?: 'replace' | 'append';
  search?: {
    maxMatches?: number;
    caseSensitive?: boolean;
  };
  pdf?: {
    navigation?: boolean;
  };
  onEvent?: (event: ViewerEvent) => void;
}