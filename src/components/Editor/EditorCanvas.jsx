import { useCallback, useState, useEffect, useRef } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useEditorStore } from "../../stores/editorStore";
import { SortableBlock } from "./SortableBlock";
import { Block } from "./Block";
import { SlashMenu } from "./SlashMenu";
import { cn } from "../../utils/cn";
import { BLOCK_TYPES } from "../../constants/BLOCK_TYPES";
import { parseMarkdown } from "../../services/markdownParser";
import { serializeBlocks } from "../../services/markdownSerializer";

/**
 * EditorCanvas - Main editing area that renders all blocks
 */
export function EditorCanvas({ onOpenLinkModal }) {
    const {
        document: editorDocument,
        activeBlockId,
        setActiveBlock,
        updateBlockContent,
        updateBlockProperties,
        splitBlock,
        mergeWithPreviousBlock,
        convertBlockType,
        moveBlock,
        addBlockAfter,
        indentBlock,
        outdentBlock,
        insertBlocksAtPosition,
        // Undo/Redo
        undo,
        redo,
        // Selection
        selectionLevel,
        selectedBlockIds,
        cycleSelection,
        clearSelection,
        deleteSelectedBlocks,
        deleteBlock,
        extendSelectionDown,
        extendSelectionUp
    } = useEditorStore();

    // Filter out nested blocks (blocks inside columns/tabs) from main canvas
    const blocks = editorDocument.blocks.filter(
        (b) => b.columnIndex === undefined && b.parentTabId === undefined
    );

    // Slash menu state
    const [slashMenu, setSlashMenu] = useState({
        isOpen: false,
        position: { top: 0, left: 0 },
        filter: "",
        blockId: null
    });

    // Track backspace presses for double-tap actions
    const backspaceTracker = useRef({ id: null, timestamp: 0 });

    // Keyboard shortcuts for undo/redo/selection
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;

            // Reset backspace tracker if any other key is pressed
            if (e.key !== "Backspace") {
                backspaceTracker.current = { id: null, timestamp: 0 };
            }

            // Ctrl+Z / Cmd+Z = Undo
            if (modKey && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z = Redo
            if (modKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                redo();
                return;
            }

            // Check if we're inside the editor canvas
            const isInEditor = e.target.closest("[data-editor-canvas]");

            // Ctrl+A = Progressive selection (only inside editor)
            // 1st tap: select text in block (browser default)
            // 2nd tap: select whole block
            // 3rd tap: select all blocks
            if (modKey && e.key === "a" && isInEditor) {
                const selection = window.getSelection();
                const hasTextSelection = selection && !selection.isCollapsed;
                const targetTextContent = e.target.textContent || "";
                const isAllTextSelected =
                    hasTextSelection &&
                    selection.toString().length >=
                        (targetTextContent.length || 0);

                // Check if we're in a container block (Tabs, Columns, Gallery, Section, etc.)
                // These should skip text selection and go straight to block selection
                const isContainerBlock =
                    e.target.closest('[data-block-type="TABS"]') ||
                    e.target.closest('[data-block-type="COLUMNS"]') ||
                    e.target.closest('[data-block-type="GALLERY"]') ||
                    e.target.closest('[data-block-type="SECTION"]') ||
                    e.target.closest('[data-block-type="DIVIDER"]') ||
                    e.target.closest('[data-block-type="IMAGE"]') ||
                    e.target.closest('[data-block-type="LINK"]');

                // For container blocks OR blocks with no text content, skip straight to block selection
                const isNoTextBlock = targetTextContent.trim().length === 0;
                if (isNoTextBlock || isContainerBlock) {
                    e.preventDefault();
                    cycleSelection();
                    return;
                }

                // If no selection or partial selection, let browser handle it (select all text in block)
                if (!hasTextSelection || !isAllTextSelected) {
                    // Let default browser behavior select text
                    return;
                }

                // If all text is selected, cycle to block/all selection
                e.preventDefault();
                cycleSelection();
                return;
            }

            // Ctrl+B = Bold (only when text is selected in editor)
            if (modKey && e.key === "b" && isInEditor) {
                // Don't prevent default - let browser handle bold on selection
                return;
            }

            // Ctrl+I = Italic (only when text is selected in editor)
            if (modKey && e.key === "i" && isInEditor) {
                // Don't prevent default - let browser handle italic on selection
                return;
            }

            // Ctrl+K = Insert Link
            if (modKey && e.key === "k") {
                e.preventDefault();
                const selection = window.getSelection();
                const selectedText = selection?.toString() || "";
                const url = prompt("Enter URL:", "https://");
                if (url && url !== "https://") {
                    document.execCommand(
                        "insertHTML",
                        false,
                        `<a href="${url}" target="_blank" rel="noopener">${selectedText || url}</a>`
                    );
                }
                return;
            }

            // Ctrl+S = Visual save feedback (auto-save already happens)
            if (modKey && e.key === "s") {
                e.preventDefault();
                // Already auto-saving, just show feedback via toast
                return;
            }

            // Ctrl+D = Duplicate block
            if (modKey && e.key === "d" && activeBlockId) {
                e.preventDefault();
                const activeBlock = blocks.find((b) => b.id === activeBlockId);
                if (activeBlock) {
                    const duplicatedBlock = {
                        ...activeBlock,
                        id: crypto.randomUUID(),
                        properties: { ...activeBlock.properties }
                    };
                    addBlockAfter(activeBlockId, duplicatedBlock);
                }
                return;
            }

            // Ctrl+Shift+Up = Move block up
            if (modKey && e.shiftKey && e.key === "ArrowUp" && activeBlockId) {
                e.preventDefault();
                const currentIndex = blocks.findIndex(
                    (b) => b.id === activeBlockId
                );
                if (currentIndex > 0) {
                    moveBlock(activeBlockId, currentIndex - 1);
                }
                return;
            }

            // Ctrl+Shift+Down = Move block down
            if (
                modKey &&
                e.shiftKey &&
                e.key === "ArrowDown" &&
                activeBlockId
            ) {
                e.preventDefault();
                const currentIndex = blocks.findIndex(
                    (b) => b.id === activeBlockId
                );
                if (currentIndex < blocks.length - 1) {
                    moveBlock(activeBlockId, currentIndex + 1);
                }
                return;
            }

            // Delete/Backspace when blocks are selected
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectionLevel >= 1
            ) {
                e.preventDefault();
                deleteSelectedBlocks();

                // Focus the first block (which may be a newly created empty paragraph)
                setTimeout(() => {
                    const firstBlock = document.querySelector(
                        "[data-editor-canvas] [data-block-id] [contenteditable]"
                    );
                    firstBlock?.focus();
                }, 0);
                return;
            }

            // Escape clears selection
            if (e.key === "Escape" && selectionLevel > 0) {
                clearSelection();
                return;
            }

            // Shift+ArrowDown = Extend block selection downward (when in editor)
            if (e.key === "ArrowDown" && e.shiftKey && !modKey && isInEditor) {
                e.preventDefault();
                extendSelectionDown();
                return;
            }

            // Shift+ArrowUp = Extend block selection upward (when in editor)
            if (e.key === "ArrowUp" && e.shiftKey && !modKey && isInEditor) {
                e.preventDefault();
                extendSelectionUp();
                return;
            }

            // Ctrl+C = Copy selected blocks
            if (
                modKey &&
                e.key === "c" &&
                selectionLevel >= 1 &&
                selectedBlockIds.length > 0
            ) {
                e.preventDefault();
                const selectedBlocks = blocks.filter((b) =>
                    selectedBlockIds.includes(b.id)
                );
                const markdown = serializeBlocks(selectedBlocks);
                navigator.clipboard.writeText(markdown);
                return;
            }

            // Ctrl+X = Cut selected blocks
            if (
                modKey &&
                e.key === "x" &&
                selectionLevel >= 1 &&
                selectedBlockIds.length > 0
            ) {
                e.preventDefault();
                const selectedBlocks = blocks.filter((b) =>
                    selectedBlockIds.includes(b.id)
                );
                const markdown = serializeBlocks(selectedBlocks);
                navigator.clipboard.writeText(markdown);
                deleteSelectedBlocks();
                return;
            }

            // Enter key on container blocks - create new paragraph below
            // This handles the case when the block is active but not focused
            if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !modKey &&
                isInEditor &&
                activeBlockId
            ) {
                const activeBlock = blocks.find((b) => b.id === activeBlockId);

                // Check if this is a NESTED block (inside column/tab)
                const isNestedBlock =
                    activeBlock?.columnIndex !== undefined ||
                    activeBlock?.parentTabId !== undefined;

                // Container block types that can't be split
                const containerTypes = [
                    BLOCK_TYPES.TABS,
                    BLOCK_TYPES.COLUMNS,
                    BLOCK_TYPES.GALLERY,
                    BLOCK_TYPES.DIVIDER,
                    BLOCK_TYPES.SECTION,
                    BLOCK_TYPES.IMAGE,
                    BLOCK_TYPES.LINK
                ];

                // Only handle for non-nested container blocks
                if (
                    !isNestedBlock &&
                    containerTypes.includes(activeBlock?.type)
                ) {
                    // Check if we're NOT in an editable input (contenteditable, input, textarea)
                    const isInEditable =
                        e.target.isContentEditable ||
                        e.target.tagName === "INPUT" ||
                        e.target.tagName === "TEXTAREA";

                    if (!isInEditable) {
                        e.preventDefault();
                        const newBlock = {
                            id: crypto.randomUUID(),
                            type: BLOCK_TYPES.PARAGRAPH,
                            content: "",
                            properties: {}
                        };
                        addBlockAfter(activeBlockId, newBlock);

                        // Focus the new block
                        setTimeout(() => {
                            const newEl = document.querySelector(
                                `[data-block-id="${newBlock.id}"] [contenteditable]`
                            );
                            newEl?.focus();
                        }, 0);
                        return;
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        undo,
        redo,
        cycleSelection,
        clearSelection,
        deleteSelectedBlocks,
        selectionLevel,
        selectedBlockIds,
        activeBlockId,
        blocks,
        addBlockAfter,
        moveBlock,
        extendSelectionDown,
        extendSelectionUp
    ]);

    /**
     * Detect if pasted text is Markdown
     */
    const isMarkdownText = useCallback((text) => {
        if (!text) return false;
        // Check for common Markdown patterns
        const mdPatterns = [
            /^#{1,6}\s/m, // Headings
            /^>\s/m, // Blockquote
            /^-\s\[([ xX])\]/m, // Task items
            /^```/m, // Code blocks
            /^---$/m, // Horizontal rules
            /\*\*[^*]+\*\*/, // Bold
            /\*[^*]+\*/, // Italic
            /\[.+\]\(.+\)/, // Links
            /!\[.*\]\(.+\)/ // Images
        ];
        return mdPatterns.some((pattern) => pattern.test(text));
    }, []);

    /**
     * Handle paste event to detect and parse Markdown
     */
    const handlePaste = useCallback(
        (e) => {
            const clipboardText = e.clipboardData.getData("text/plain");

            // Only process if it looks like Markdown with multiple patterns
            if (clipboardText && isMarkdownText(clipboardText)) {
                e.preventDefault();

                // Parse the Markdown into blocks
                const parsed = parseMarkdown(clipboardText);

                if (parsed.blocks && parsed.blocks.length > 0) {
                    // Insert the blocks after the current active block
                    insertBlocksAtPosition(activeBlockId, parsed.blocks);
                }
            }
            // If not Markdown, let the default paste behavior work
        },
        [activeBlockId, insertBlocksAtPosition, isMarkdownText]
    );

    // Handle content changes and check for slash command and Markdown shortcuts
    const handleContentChange = useCallback(
        (blockId, content) => {
            // Check for Markdown shortcuts first
            const markdownShortcuts = [
                { pattern: /^### $/, type: BLOCK_TYPES.HEADING_3 },
                { pattern: /^## $/, type: BLOCK_TYPES.HEADING_2 },
                { pattern: /^# $/, type: BLOCK_TYPES.HEADING_1 },
                { pattern: /^> $/, type: BLOCK_TYPES.QUOTE },
                { pattern: /^- \[ \] $/, type: BLOCK_TYPES.TASK },
                { pattern: /^---$/, type: BLOCK_TYPES.DIVIDER }
            ];

            for (const { pattern, type } of markdownShortcuts) {
                if (pattern.test(content)) {
                    // Convert block type and clear content
                    convertBlockType(blockId, type, "");

                    // Focus back to the block
                    setTimeout(() => {
                        const blockEl = window.document.querySelector(
                            `[data-block-id="${blockId}"]`
                        );
                        if (blockEl) {
                            blockEl.focus();
                        }
                    }, 0);
                    return; // Exit early, don't update content
                }
            }

            updateBlockContent(blockId, content);

            // Check if content starts with / for slash menu
            if (content.startsWith("/") && slashMenu.blockId === null) {
                // Open slash menu
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();
                    setSlashMenu({
                        isOpen: true,
                        position: { top: rect.bottom + 8, left: rect.left },
                        filter: content.slice(1), // Everything after /
                        blockId: blockId
                    });
                }
            } else if (slashMenu.isOpen && blockId === slashMenu.blockId) {
                // Update filter while menu is open
                if (content.startsWith("/")) {
                    setSlashMenu((prev) => ({
                        ...prev,
                        filter: content.slice(1)
                    }));
                } else {
                    // Content no longer starts with /, close menu
                    setSlashMenu({
                        isOpen: false,
                        position: { top: 0, left: 0 },
                        filter: "",
                        blockId: null
                    });
                }
            }
        },
        [
            updateBlockContent,
            slashMenu.isOpen,
            slashMenu.blockId,
            convertBlockType
        ]
    );

    // Handle slash menu selection
    const handleSlashMenuSelect = useCallback(
        (blockType) => {
            if (!slashMenu.blockId) return;

            // Handle Link block separately if modal handler is provided
            if (blockType === BLOCK_TYPES.LINK && onOpenLinkModal) {
                // Close the menu first
                setSlashMenu({
                    isOpen: false,
                    position: { top: 0, left: 0 },
                    filter: "",
                    blockId: null
                });

                onOpenLinkModal((url) => {
                    // Convert the block type with the provided URL
                    convertBlockType(slashMenu.blockId, blockType, url);

                    // Focus back to the block
                    setTimeout(() => {
                        const blockEl = window.document.querySelector(
                            `[data-block-id="${slashMenu.blockId}"]`
                        );
                        if (blockEl) {
                            blockEl.focus();
                        }
                    }, 0);
                });
                return;
            }

            // Convert the block type and clear the slash command
            convertBlockType(slashMenu.blockId, blockType, "");

            // Close the menu
            setSlashMenu({
                isOpen: false,
                position: { top: 0, left: 0 },
                filter: "",
                blockId: null
            });

            // Focus back to the block (after a tick to allow DOM update)
            setTimeout(() => {
                const blockEl = window.document.querySelector(
                    `[data-block-id="${slashMenu.blockId}"]`
                );
                if (blockEl) {
                    blockEl.focus();
                }
            }, 0);
        },
        [slashMenu.blockId, convertBlockType, onOpenLinkModal]
    );

    // Handle slash menu close
    const handleSlashMenuClose = useCallback(() => {
        setSlashMenu({
            isOpen: false,
            position: { top: 0, left: 0 },
            filter: "",
            blockId: null
        });
    }, []);

    // Handle property changes
    const handlePropertiesChange = useCallback(
        (blockId, properties) => {
            updateBlockProperties(blockId, properties);
        },
        [updateBlockProperties]
    );

    // Handle block focus
    const handleFocus = useCallback(
        (blockId) => {
            setActiveBlock(blockId);
        },
        [setActiveBlock]
    );

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (e, blockId) => {
            // If slash menu is open, let it handle keyboard events
            if (slashMenu.isOpen) {
                return;
            }

            // If we have selected blocks (via Ctrl+A), delete them on Backspace/Delete
            if (
                selectionLevel > 0 &&
                (e.key === "Backspace" || e.key === "Delete")
            ) {
                e.preventDefault();
                deleteSelectedBlocks();
                return;
            }

            const selection = window.getSelection();
            const cursorPosition = selection?.anchorOffset || 0;

            // Tab - Indent/Outdent block
            if (e.key === "Tab") {
                e.preventDefault();
                if (e.shiftKey) {
                    outdentBlock(blockId);
                } else {
                    indentBlock(blockId);
                }
                return;
            }

            // Enter - Split block or create new
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();

                // Find the current block
                const block = blocks.find((b) => b.id === blockId);

                // Check if this is a NESTED block (inside column/tab)
                // Nested blocks should use normal text split behavior
                const isNestedBlock =
                    block?.columnIndex !== undefined ||
                    block?.parentTabId !== undefined;

                // Container block types that can't be split
                const containerTypes = [
                    BLOCK_TYPES.TABS,
                    BLOCK_TYPES.COLUMNS,
                    BLOCK_TYPES.GALLERY,
                    BLOCK_TYPES.DIVIDER,
                    BLOCK_TYPES.SECTION,
                    BLOCK_TYPES.IMAGE,
                    BLOCK_TYPES.LINK
                ];

                // If it's a container block (and NOT nested), add new block after
                if (!isNestedBlock && containerTypes.includes(block?.type)) {
                    const newBlock = {
                        id: crypto.randomUUID(),
                        type: BLOCK_TYPES.PARAGRAPH,
                        content: "",
                        properties: {}
                    };
                    addBlockAfter(blockId, newBlock);

                    // Focus the new block's contenteditable
                    setTimeout(() => {
                        const newEl = document.querySelector(
                            `[data-block-id="${newBlock.id}"] [contenteditable]`
                        );
                        newEl?.focus();
                    }, 0);
                    return;
                }

                // Regular text block - split using DOM Range to preserve formatting
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const blockEl = e.currentTarget;

                    // Ensure selection is actually inside this block
                    if (!blockEl.contains(range.commonAncestorContainer)) {
                        return;
                    }

                    // Extract HTML BEFORE cursor
                    const rangeBefore = range.cloneRange();
                    rangeBefore.collapse(true);
                    rangeBefore.setStart(blockEl, 0);

                    const div = document.createElement("div");
                    div.appendChild(rangeBefore.cloneContents());
                    const htmlBefore = div.innerHTML;

                    // Extract HTML AFTER cursor
                    const rangeAfter = range.cloneRange();
                    rangeAfter.collapse(false);
                    rangeAfter.setEnd(blockEl, blockEl.childNodes.length);

                    div.innerHTML = "";
                    div.appendChild(rangeAfter.cloneContents());
                    const htmlAfter = div.innerHTML;

                    // Manually update original block's DOM to prevent duplication
                    // (contentEditable maintains its own state, React won't re-render it)
                    blockEl.innerHTML = htmlBefore;

                    // If splitting a task, create another task
                    const nextType =
                        block?.type === BLOCK_TYPES.TASK
                            ? BLOCK_TYPES.TASK
                            : BLOCK_TYPES.PARAGRAPH;

                    splitBlock(blockId, htmlBefore, htmlAfter, nextType);
                }
            }

            // Backspace at start - Merge with previous or delete container block
            if (e.key === "Backspace") {
                const isCollapsed = selection?.isCollapsed !== false;
                const blockIndex = blocks.findIndex((b) => b.id === blockId);
                const block = blocks[blockIndex];

                // Container block types that don't have editable content
                const containerTypes = [
                    BLOCK_TYPES.TABS,
                    BLOCK_TYPES.COLUMNS,
                    BLOCK_TYPES.GALLERY,
                    BLOCK_TYPES.SECTION,
                    BLOCK_TYPES.DIVIDER
                ];
                const isContainerBlock = containerTypes.includes(block?.type);

                // For container blocks, check if they're truly empty
                if (isContainerBlock) {
                    const hasNestedContent =
                        (block?.children &&
                            Object.keys(block.children).length > 0) ||
                        block?.properties?.images?.length > 0 ||
                        block?.properties?.tabs?.some(
                            (t) => block.children?.[t.id]?.length > 0
                        );

                    // Allow deletion if:
                    // - Block is truly empty (no nested content)
                    // - OR it's a simple divider/section
                    // - AND there's more than one block OR this isn't the only block
                    if (
                        !hasNestedContent ||
                        block?.type === BLOCK_TYPES.DIVIDER ||
                        block?.type === BLOCK_TYPES.SECTION
                    ) {
                        e.preventDefault();
                        if (blockIndex > 0) {
                            mergeWithPreviousBlock(blockId);
                        } else if (blocks.length > 1) {
                            // First block - just delete it and focus next
                            deleteSelectedBlocks();
                            const nextBlock = blocks[1];
                            if (nextBlock) {
                                setActiveBlock(nextBlock.id);
                            }
                        }
                        return;
                    }
                }

                // Get actual DOM content for regular blocks
                const target = e.currentTarget;
                let domContent = "";
                let cursorAtStart = false;

                if (target?.tagName === "TEXTAREA") {
                    // For textarea elements
                    domContent = target.value || "";
                    cursorAtStart =
                        target.selectionStart === 0 &&
                        target.selectionEnd === 0;
                } else {
                    // For contentEditable elements
                    domContent = target?.textContent || "";
                    cursorAtStart = cursorPosition === 0;
                }

                const isBlockEmpty = domContent.length === 0;

                // SPECIAL HANDLER: Backspace on empty Task block -> convert to Paragraph
                // This allows users to "undo" a task creation easily without deleting the block
                if (isBlockEmpty && block?.type === BLOCK_TYPES.TASK) {
                    e.preventDefault();
                    convertBlockType(blockId, BLOCK_TYPES.PARAGRAPH);
                    return;
                }

                // SPECIAL HANDLER: Backspace in empty Columns block -> delete the columns
                // If the user hits backspace in an empty column and the entire columns block is empty
                if (isBlockEmpty && e.key === "Backspace") {
                    // We might be in a nested block, so we need to find the specific block object
                    let currentBlock = block;
                    if (!currentBlock) {
                        currentBlock = editorDocument.blocks.find(
                            (b) => b.id === blockId
                        );
                    }

                    if (currentBlock?.columnIndex !== undefined) {
                        // Find parent COLUMNS block
                        const parentBlock = editorDocument.blocks.find(
                            (p) =>
                                p.type === BLOCK_TYPES.COLUMNS &&
                                p.children?.some((col) =>
                                    col.blocks?.includes(blockId)
                                )
                        );

                        if (parentBlock) {
                            // Check if the ENTIRE columns block is effectively empty
                            // (meaning all columns have either no blocks or only empty paragraphs)
                            const allColumnsEmpty =
                                parentBlock.children?.every((col) => {
                                    if (!col.blocks || col.blocks.length === 0)
                                        return true;
                                    return col.blocks.every((childId) => {
                                        const child =
                                            editorDocument.blocks.find(
                                                (b) => b.id === childId
                                            );
                                        // It's empty if it has no content
                                        return (
                                            !child?.content ||
                                            child.content.trim() === ""
                                        );
                                    });
                                }) ?? true;

                            if (allColumnsEmpty) {
                                // Double tap detection (within 1000ms)
                                const now = Date.now();
                                const isDoubleTap =
                                    backspaceTracker.current.id === blockId &&
                                    now - backspaceTracker.current.timestamp <
                                        1000;

                                if (isDoubleTap) {
                                    e.preventDefault();
                                    deleteBlock(parentBlock.id);
                                    // Reset tracker
                                    backspaceTracker.current = {
                                        id: null,
                                        timestamp: 0
                                    };
                                    return;
                                } else {
                                    // First tap - register and prevent default
                                    // User needs to tap again to confirm deletion
                                    e.preventDefault();
                                    backspaceTracker.current = {
                                        id: blockId,
                                        timestamp: now
                                    };
                                    return;
                                }
                            }
                        }
                    }
                }

                // Merge if at start (or block is empty) with no selection
                // Only for top-level blocks or handled separately
                if (
                    (cursorAtStart || isBlockEmpty) &&
                    isCollapsed &&
                    blockIndex > 0
                ) {
                    e.preventDefault();
                    mergeWithPreviousBlock(blockId);
                }
            }

            // Arrow Up - Move to previous block when at start
            if (e.key === "ArrowUp" && !e.shiftKey) {
                const blockIndex = blocks.findIndex((b) => b.id === blockId);

                // Check if cursor is at the very start
                const selection = window.getSelection();
                const range = selection?.getRangeAt(0);
                const isAtStart =
                    range?.startOffset === 0 &&
                    (range?.startContainer === e.currentTarget ||
                        range?.startContainer === e.currentTarget.firstChild ||
                        (selection?.anchorNode?.previousSibling === null &&
                            range?.startOffset === 0));

                if (blockIndex > 0 && isAtStart) {
                    e.preventDefault();
                    const prevBlock = blocks[blockIndex - 1];
                    setActiveBlock(prevBlock.id);
                    // Focus at end of previous block
                    setTimeout(() => {
                        const prevEl = window.document.querySelector(
                            `[data-block-id="${prevBlock.id}"] [contenteditable]`
                        );
                        if (prevEl) {
                            prevEl.focus();
                            const range = window.document.createRange();
                            range.selectNodeContents(prevEl);
                            range.collapse(false); // false = end
                            const sel = window.getSelection();
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    }, 0);
                }
            }

            // Arrow Down - Move to next block when at end
            if (e.key === "ArrowDown" && !e.shiftKey) {
                const blockIndex = blocks.findIndex((b) => b.id === blockId);

                // Check if cursor is at the very end
                const selection = window.getSelection();
                const range = selection?.getRangeAt(0);
                const target = e.currentTarget;
                const isAtEnd =
                    range?.endOffset ===
                        (range?.endContainer?.textContent?.length || 0) &&
                    (range?.endContainer === target ||
                        range?.endContainer?.nextSibling === null);

                if (blockIndex < blocks.length - 1 && isAtEnd) {
                    e.preventDefault();
                    const nextBlock = blocks[blockIndex + 1];
                    setActiveBlock(nextBlock.id);
                    // Focus at start of next block
                    setTimeout(() => {
                        const nextEl = window.document.querySelector(
                            `[data-block-id="${nextBlock.id}"] [contenteditable]`
                        );
                        if (nextEl) {
                            nextEl.focus();
                            const range = window.document.createRange();
                            range.selectNodeContents(nextEl);
                            range.collapse(true); // true = start
                            const sel = window.getSelection();
                            sel?.removeAllRanges();
                            sel?.addRange(range);
                        }
                    }, 0);
                }
            }
        },
        [
            blocks,
            splitBlock,
            mergeWithPreviousBlock,
            setActiveBlock,
            slashMenu.isOpen,
            indentBlock,
            outdentBlock,
            deleteSelectedBlocks,
            deleteBlock,
            addBlockAfter,
            selectionLevel,
            editorDocument,
            convertBlockType
        ]
    );

    // Handle click on empty canvas area
    const handleCanvasClick = useCallback(
        (e) => {
            // Only trigger if clicking directly on canvas, not on a block
            if (e.target === e.currentTarget) {
                // Focus the last block or create one if empty
                if (blocks.length > 0) {
                    const lastBlock = blocks[blocks.length - 1];
                    const containerTypes = [
                        BLOCK_TYPES.TABS,
                        BLOCK_TYPES.COLUMNS,
                        BLOCK_TYPES.GALLERY,
                        BLOCK_TYPES.DIVIDER,
                        BLOCK_TYPES.SECTION,
                        BLOCK_TYPES.IMAGE,
                        BLOCK_TYPES.LINK
                    ];

                    // If last block is a container, create a new paragraph below it
                    // This allows users to "escape" the container at the end of document
                    if (containerTypes.includes(lastBlock.type)) {
                        const newBlock = {
                            id: crypto.randomUUID(),
                            type: BLOCK_TYPES.PARAGRAPH,
                            content: "",
                            properties: {}
                        };
                        addBlockAfter(lastBlock.id, newBlock);

                        // Focus new block
                        setTimeout(() => {
                            const newEl = document.querySelector(
                                `[data-block-id="${newBlock.id}"] [contenteditable]`
                            );
                            newEl?.focus();
                        }, 0);
                    } else {
                        // Otherwise just focus the last block (e.g. it's a paragraph)
                        setActiveBlock(lastBlock.id);
                    }
                } else {
                    // Document is empty (blocks.length === 0)
                    // Create a new paragraph block
                    const newBlock = {
                        id: crypto.randomUUID(),
                        type: BLOCK_TYPES.PARAGRAPH,
                        content: "",
                        properties: {}
                    };
                    addBlockAfter(null, newBlock); // Pass null to add at start/push

                    // Focus new block
                    setTimeout(() => {
                        const newEl = document.querySelector(
                            `[data-block-id="${newBlock.id}"] [contenteditable]`
                        );
                        newEl?.focus();
                    }, 0);
                }
            }
        },
        [blocks, setActiveBlock, addBlockAfter, document]
    );

    // Drag and drop state
    const [activeId, setActiveId] = useState(null);
    const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

    // Configure sensors for drag - require 8px movement before dragging starts
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 }
        })
    );

    // Handle drag start
    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, []);

    // Handle drag end
    const handleDragEnd = useCallback(
        (event) => {
            const { active, over } = event;
            setActiveId(null);

            if (over && active.id !== over.id) {
                const oldIndex = blocks.findIndex((b) => b.id === active.id);
                const newIndex = blocks.findIndex((b) => b.id === over.id);
                moveBlock(active.id, newIndex > oldIndex ? newIndex : newIndex);
            }
        },
        [blocks, moveBlock]
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div
                data-editor-canvas
                className={cn(
                    "w-full max-w-3xl mx-auto",
                    "min-h-[calc(100vh-8rem)]",
                    "px-16 py-8",
                    "cursor-text"
                )}
                onClick={handleCanvasClick}
                onPaste={handlePaste}
            >
                <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {blocks.map((block, index) => (
                        <SortableBlock
                            key={block.id}
                            block={block}
                            isActive={activeBlockId === block.id}
                            isSelected={selectedBlockIds.includes(block.id)}
                            isFirstBlock={index === 0}
                            isSingleBlock={blocks.length === 1}
                            onContentChange={handleContentChange}
                            onPropertiesChange={handlePropertiesChange}
                            onKeyDown={handleKeyDown}
                            onFocus={handleFocus}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Drag Overlay - shows ghost of dragged block */}
            <DragOverlay>
                {activeBlock && (
                    <div className="shadow-xl ring-2 ring-blue-500/30 rounded-lg bg-white opacity-90">
                        <Block
                            block={activeBlock}
                            isActive={false}
                            onContentChange={() => {}}
                            onPropertiesChange={() => {}}
                            onKeyDown={() => {}}
                            onFocus={() => {}}
                        />
                    </div>
                )}
            </DragOverlay>

            {/* Slash Menu */}
            <SlashMenu
                isOpen={slashMenu.isOpen}
                position={slashMenu.position}
                filter={slashMenu.filter}
                onSelect={handleSlashMenuSelect}
                onClose={handleSlashMenuClose}
            />
        </DndContext>
    );
}
