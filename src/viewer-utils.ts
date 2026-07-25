/**
 * Converts an unknown value into an object record.
 */
export function asRecord(
    value: unknown
): Record<string, unknown> | undefined {
    if (
        typeof value !== 'object' ||
        value === null
    ) {
        return undefined;
    }

    return value as Record<string, unknown>;
}

/**
 * Reads a property from an unknown object.
 */
export function getProperty(
    value: unknown,
    property: string
): unknown {
    return asRecord(value)?.[property];
}

/**
 * Reads a numeric value.
 */
export function numberValue(
    value: unknown
): number | undefined {
    return typeof value === 'number'
        ? value
        : undefined;
}

/**
 * Extracts the current one-based page number
 * from controller state.
 */
export function extractPage(
    state: unknown
): number | undefined {
    const value =
        asRecord(state);

    if (!value) {
        return undefined;
    }

    if (
        typeof value.page === 'number'
    ) {
        return value.page;
    }

    if (
        typeof value.currentPage === 'number'
    ) {
        return value.currentPage;
    }

    if (
        typeof value.pageNumber === 'number'
    ) {
        return value.pageNumber;
    }

    if (
        typeof value.pageIndex === 'number'
    ) {
        return value.pageIndex + 1;
    }

    return undefined;
}

/**
 * Extracts the total page count from
 * controller state.
 */
export function extractTotalPages(
    state: unknown
): number {
    const value =
        asRecord(state);

    if (!value) {
        return 0;
    }

    const total =
        value.totalPages ??
        value.pageCount ??
        value.total ??
        value.numPages;

    return typeof total === 'number'
        ? total
        : 0;
}

/**
 * Extracts the numeric zoom scale from
 * the controller's zoom state.
 */
export function extractZoom(
    value: unknown
): number | undefined {
    if (
        typeof value === 'number'
    ) {
        return value;
    }

    const zoom =
        asRecord(value);

    if (
        typeof zoom?.scale === 'number'
    ) {
        return zoom.scale;
    }

    if (
        typeof zoom?.zoom === 'number'
    ) {
        return zoom.zoom;
    }

    if (
        typeof zoom?.value === 'number'
    ) {
        return zoom.value;
    }

    return undefined;
}

/**
 * Finds an array inside an arbitrary search response.
 *
 * The different renderers do not necessarily return exactly the
 * same search response shape. In particular, spreadsheet and
 * presentation renderers may wrap their matches differently.
 *
 * This function deliberately does not maintain any search state.
 */
function extractSearchArray(
    value: unknown
): unknown[] {
    if (
        Array.isArray(value)
    ) {
        return value;
    }

    const object =
        asRecord(value);

    if (!object) {
        return [];
    }

    const candidates: unknown[] = [
        object.results,
        object.matches,
        object.items,
        object.searchResults,
        object.searchMatches,
        object.entries,
        object.documents,
    ];

    for (
        const candidate of candidates
    ) {
        if (
            Array.isArray(candidate)
        ) {
            return candidate;
        }
    }

    return [];
}

/**
 * Converts a possible page value to a zero-based page index.
 */
function extractSearchPageIndex(
    value: Record<string, unknown>
): number | undefined {
    if (
        typeof value.pageIndex === 'number'
    ) {
        return value.pageIndex;
    }

    if (
        typeof value.page === 'number'
    ) {
        return Math.max(
            0,
            value.page - 1
        );
    }

    if (
        typeof value.pageNumber === 'number'
    ) {
        return Math.max(
            0,
            value.pageNumber - 1
        );
    }

    if (
        typeof value.slideIndex === 'number'
    ) {
        return value.slideIndex;
    }

    if (
        typeof value.slide === 'number'
    ) {
        return Math.max(
            0,
            value.slide - 1
        );
    }

    if (
        typeof value.sheetIndex === 'number'
    ) {
        return value.sheetIndex;
    }

    return undefined;
}

/**
 * Extracts matched text from the renderer result.
 */
function extractSearchText(
    value: Record<string, unknown>
): string | undefined {
    const candidates = [
        value.text,
        value.match,
        value.matchedText,
        value.value,
        value.content,
        value.label,
    ];

    for (
        const candidate of candidates
    ) {
        if (
            typeof candidate === 'string'
        ) {
            return candidate;
        }
    }

    return undefined;
}

/**
 * Extracts a rectangle from a renderer result.
 *
 * Different renderers may expose the rectangle directly or inside
 * bounds / boundingBox.
 */
function extractSearchRect(
    value: Record<string, unknown>
): SearchResult['rect'] | undefined {
    const candidates = [
        value.rect,
        value.bounds,
        value.boundingBox,
    ];

    for (
        const candidate of candidates
    ) {
        const rect =
            asRecord(candidate);

        if (
            !rect
        ) {
            continue;
        }

        if (
            typeof rect.left === 'number' &&
            typeof rect.top === 'number' &&
            typeof rect.right === 'number' &&
            typeof rect.bottom === 'number'
        ) {
            return {
                left:
                    rect.left,

                top:
                    rect.top,

                right:
                    rect.right,

                bottom:
                    rect.bottom,
            };
        }

        if (
            typeof rect.x === 'number' &&
            typeof rect.y === 'number' &&
            typeof rect.width === 'number' &&
            typeof rect.height === 'number'
        ) {
            return {
                left:
                    rect.x,

                top:
                    rect.y,

                right:
                    rect.x + rect.width,

                bottom:
                    rect.y + rect.height,
            };
        }
    }

    return undefined;
}

/**
 * Normalizes raw search results into the Android-facing model.
 *
 * IMPORTANT:
 *
 * This function is stateless. It does not store the results and
 * does not attempt to implement next/previous navigation.
 *
 * Search navigation belongs to the underlying viewer controller.
 *
 * Renderer-specific result shapes are accepted where enough
 * information is available. Results without a page, text, or
 * usable bounds are ignored because they cannot be represented by
 * the public SearchResult contract.
 */
export function normalizeSearchResults(
    value: unknown
): SearchResult[] {
    const values =
        extractSearchArray(
            value
        );

    const results:
        SearchResult[] = [];

    for (
        const item of values
    ) {
        const object =
            asRecord(item);

        if (!object) {
            continue;
        }

        const pageIndex =
            extractSearchPageIndex(
                object
            );

        const text =
            extractSearchText(
                object
            );

        const rect =
            extractSearchRect(
                object
            );

        if (
            pageIndex === undefined ||
            text === undefined
        ) {
            continue;
        }

        /*
         * Some renderers can report a match without coordinates.
         *
         * The public API currently requires coordinates, so such a
         * result cannot safely be exposed as SearchResult.
         */
        if (!rect) {
            continue;
        }

        results.push({
            pageIndex,

            text,

            rect,
        });
    }

    return results;
}

/**
 * Converts an unknown thrown value into
 * a readable error message.
 */
export function getErrorMessage(
    error: unknown
): string {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    if (
        typeof error === 'string'
    ) {
        return error;
    }

    return String(error);
}

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
