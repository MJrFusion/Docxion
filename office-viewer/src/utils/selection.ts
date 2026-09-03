import { TextSelection, SelectionRect } from "../types/core";

/**
 * Obtains the current browser text selection and converts its geometry
 * into the viewer's selection representation.
 *
 * <p>The selection is obtained directly from the browser's Selection API
 * rather than from the file viewer event system.</p>
 *
 * <p>{@link Range#getClientRects} is used instead of a single bounding
 * rectangle so that selections spanning multiple lines can be represented
 * by multiple rectangles.</p>
 *
 * @param log logger used for selection diagnostics
 *
 * @return the current text selection, or {@code null} when there is no
 *         non-collapsed selection or no valid selection rectangles
 */
function getDomSelection(log: (message: string) => void): TextSelection | null {
    const selection = window.getSelection();

    log(`[Docxion] window.getSelection(): ${selection}`);
    log(`[Docxion] rangeCount: ${selection?.rangeCount}`);
    log(`[Docxion] isCollapsed: ${selection?.isCollapsed}`);
    log(`[Docxion] anchorNode: ${selection?.anchorNode}`);
    log(`[Docxion] focusNode: ${selection?.focusNode}`);

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        log(`[Docxion] getDomSelection: Selection is null or its range is 0`);
        return null;
    }

    const range = selection.getRangeAt(0);

    log(`[Docxion] type: ${selection.type}`);
    log(`[Docxion] isCollapsed: ${selection.isCollapsed}`);
    log(`[Docxion] anchorOffset: ${selection.anchorOffset}`);
    log(`[Docxion] focusOffset: ${selection.focusOffset}`);
    log(`[Docxion] selected text: ${JSON.stringify(selection.toString())}`);
    log(`[Docxion] range start: ${range.startContainer} @ ${range.startOffset}`);
    log(`[Docxion] range end: ${range.endContainer} @ ${range.endOffset}`);
    log(`[Docxion] range collapsed: ${range.collapsed}`);
    log(`[Docxion] range text: ${JSON.stringify(range.toString())}`);

    const domRects = range.getClientRects();

    log(`[Docxion] DOM selection client rects: ${JSON.stringify(domRects)}`);

    const rects: SelectionRect[] = [];

    for (let index = 0; index < domRects.length; index += 1) {
        const rect = domRects[index];

        log(
            `[Docxion] selection rect: ` +
            `left=${rect.left}, top=${rect.top}, ` +
            `right=${rect.right}, bottom=${rect.bottom}, ` +
            `width=${rect.width}, height=${rect.height}`
        );

        if (
            !Number.isFinite(rect.left) ||
            !Number.isFinite(rect.top) ||
            !Number.isFinite(rect.right) ||
            !Number.isFinite(rect.bottom)
        ) {
            continue;
        }

        if (rect.width <= 0 || rect.height <= 0) {
            continue;
        }

        rects.push({
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
        });
    }

    const result = rects.length > 0 ? { rects } : null;

    log(
        `[Docxion] DOM selection result: ${JSON.stringify(result)}`
    );

    return result;
}

export {
    getDomSelection,
};