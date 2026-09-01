import type {
    AndroidCallbacks
} from './types/core';

/**
 * One-way adapter from the viewer integration to Android.
 *
 * Viewer state is owned by @file-viewer/web.
 *
 * This class only forwards explicit notifications.
 */
export class AndroidJsBridge {
    constructor(
        private readonly android?: AndroidCallbacks
    ) {}

    pageChanged(
        page: number,
        totalPages: number
    ): void {
        this.android?.onPageChanged(
            page,
            totalPages
        );
    }

    zoomChanged(
        zoom: number
    ): void {
        this.android?.onZoomChanged(
            zoom
        );
    }

    textSelected(
        text: string | null
    ): void {
        this.android?.onTextSelected(
            text
        );
    }

    ready(
        timestamp: number
    ): void {
        this.android?.onReady(
            timestamp
        );
    }

    error(
        message: string,
        code?: string
    ): void {
        this.android?.onError(
            message,
            code
        );
    }
}