import { AndroidCallbacks, TextSelection } from "./core";

/**
 * One-way adapter from the viewer integration to Android.
 *
 * Viewer state is owned by @file-viewer/web.
 *
 * This class only forwards explicit notifications.
 */
export class AndroidJsBridge {
    constructor(private readonly android?: AndroidCallbacks) {}

    pageChanged(page: number, totalPages: number): void {
        this.android?.onPageChanged(page, totalPages);
    }

    zoomChanged(zoom: number): void {
        this.android?.onZoomChanged(zoom);
    }

    textSelected(selection: TextSelection | null): void {
        this.android?.onTextSelected(selection);
    }

    ready(timestamp: number): void {
        this.android?.onReady(timestamp);
    }

    log(message: string): void {
        this.android?.log(message);
    }

    error(message: string, code?: string): void {
        this.android?.onError(message, code);
    }
}