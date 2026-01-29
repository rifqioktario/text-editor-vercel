import { useState, useEffect, useCallback } from "react";

/**
 * useTextSelection - Hook to track text selection state
 */
export function useTextSelection() {
    const [selection, setSelection] = useState({
        hasSelection: false,
        text: "",
        blockId: null,
        range: null
    });

    // Handle selection change
    const handleSelectionChange = useCallback(() => {
        const sel = window.getSelection();

        if (!sel || sel.isCollapsed || !sel.toString().trim()) {
            setSelection({
                hasSelection: false,
                text: "",
                blockId: null,
                range: null
            });
            return;
        }

        // Find the block containing the selection
        const anchorNode = sel.anchorNode;
        const blockElement =
            anchorNode?.parentElement?.closest("[data-block-id]");
        const blockId = blockElement?.getAttribute("data-block-id") || null;

        setSelection({
            hasSelection: true,
            text: sel.toString(),
            blockId,
            range: sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
        });
    }, []);

    // Listen for selection changes
    useEffect(() => {
        document.addEventListener("selectionchange", handleSelectionChange);
        return () =>
            document.removeEventListener(
                "selectionchange",
                handleSelectionChange
            );
    }, [handleSelectionChange]);

    return selection;
}
