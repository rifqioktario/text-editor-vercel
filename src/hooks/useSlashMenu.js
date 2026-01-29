import { useState, useCallback } from "react";

/**
 * useSlashMenu - Hook for managing slash menu state
 */
export function useSlashMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [filter, setFilter] = useState("");
    const [triggerBlockId, setTriggerBlockId] = useState(null);
    const [slashStartPos, setSlashStartPos] = useState(null);

    /**
     * Open the slash menu at the current cursor position
     */
    const openMenu = useCallback((blockId) => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position menu below cursor
        setPosition({
            top: rect.bottom + 8,
            left: rect.left
        });
        setFilter("");
        setTriggerBlockId(blockId);
        setSlashStartPos(selection.anchorOffset);
        setIsOpen(true);
    }, []);

    /**
     * Close the slash menu
     */
    const closeMenu = useCallback(() => {
        setIsOpen(false);
        setFilter("");
        setTriggerBlockId(null);
        setSlashStartPos(null);
    }, []);

    /**
     * Update the filter query (characters after /)
     */
    const updateFilter = useCallback((query) => {
        setFilter(query);
    }, []);

    /**
     * Get the slash command text to remove from content
     */
    const getSlashCommand = useCallback(() => {
        return "/" + filter;
    }, [filter]);

    return {
        isOpen,
        position,
        filter,
        triggerBlockId,
        slashStartPosition: slashStartPos,
        openMenu,
        closeMenu,
        updateFilter,
        getSlashCommand
    };
}
