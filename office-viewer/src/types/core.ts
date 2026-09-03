/**
 * Public representation of a document search result.
 */
export interface SearchResult {
    /** Zero-based page index containing the match. */
    pageIndex: number;
    /** Matched text. */
    text: string;
    /** Bounds of the matched text. */
    rect: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
}

/**
 * One visual fragment of a document text selection.
 */
export interface SelectionRect {
    /** Left coordinate of the selected fragment. */
    left: number;
    /** Top coordinate of the selected fragment. */
    top: number;
    /** Right coordinate of the selected fragment. */
    right: number;
    /** Bottom coordinate of the selected fragment. */
    bottom: number;
}

/**
 * Public representation of a document text selection.
 *
 * A selection may span multiple lines and therefore contain
 * multiple visual rectangles.
 */
export interface TextSelection {
    /** Visual rectangles occupied by the selection. */
    rects: SelectionRect[];
}

/**
 * Bridge exposed by the Android WebView.
 */
export interface AndroidCallbacks {
    log(message: string): void;
    onPageChanged(page: number, totalPages: number): void;
    onZoomChanged(zoom: number): void;
    onTextSelected(selection: TextSelection | null): void;
    onReady(timestamp: number): void;
    onError(message: string, code?: string): void;
}

/**
 * Programmatic API exposed by the viewer adapter.
 */
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
    /**
     * Starts/replaces the active search in the underlying viewer.
     *
     * The adapter does not retain the returned matches.
     */
    search(query: string): Promise<SearchResult[]>;
    /**
     * Clears the active search in the underlying viewer.
     */
    clearSearch(): void;
    /**
     * Navigates the active search owned by the underlying viewer.
     */
    goToNextMatch(): Promise<void>;
    /**
     * Navigates the active search owned by the underlying viewer.
     */
    goToPreviousMatch(): Promise<void>;
    getSelectedText(): string | null;
    clearSelection(): void;
    setTheme(theme: 'light' | 'dark'): void;
    getTheme(): 'light' | 'dark';
    print(): void;
    destroy(): void;
    isReady(): boolean;
}

/**
 * Configuration used to mount the viewer.
 */
export interface ViewerOptions {
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