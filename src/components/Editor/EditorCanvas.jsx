import { useCallback, useState, useEffect } from "react";
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

/**
 * EditorCanvas - Main editing area that renders all blocks
 */
export function EditorCanvas() {
    const {
        document,
        activeBlockId,
        setActiveBlock,
        updateBlockContent,
        updateBlockProperties,
        splitBlock,
        mergeWithPreviousBlock,
        convertBlockType,
        moveBlock,
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
        deleteSelectedBlocks
    } = useEditorStore();

    const blocks = document.blocks;

    // Slash menu state
    const [slashMenu, setSlashMenu] = useState({
        isOpen: false,
        position: { top: 0, left: 0 },
        filter: "",
        blockId: null
    });

    // Keyboard shortcuts for undo/redo/selection
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const modKey = isMac ? e.metaKey : e.ctrlKey;

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

            // Ctrl+A = Progressive selection
            if (modKey && e.key === "a") {
                e.preventDefault();
                cycleSelection();
                return;
            }

            // Delete/Backspace when blocks are selected
            if (
                (e.key === "Delete" || e.key === "Backspace") &&
                selectionLevel >= 2
            ) {
                e.preventDefault();
                deleteSelectedBlocks();
                return;
            }

            // Escape clears selection
            if (e.key === "Escape" && selectionLevel > 0) {
                clearSelection();
                return;
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
        selectionLevel
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
                { pattern: /^---$/, type: BLOCK_TYPES.DIVIDER },
                { pattern: /^```$/, type: BLOCK_TYPES.CODE }
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
        [slashMenu.blockId, convertBlockType]
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

                // Get cursor position from selection
                const range = selection?.getRangeAt(0);
                const offset = range?.startOffset || 0;

                splitBlock(blockId, offset);
            }

            // Backspace at start - Merge with previous
            if (e.key === "Backspace") {
                const isCollapsed = selection?.isCollapsed !== false;
                const blockIndex = blocks.findIndex((b) => b.id === blockId);
                const block = blocks[blockIndex];

                // Get actual DOM content - check for textarea (CodeBlock) or contentEditable
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

                // For Divider blocks, always allow deletion
                const isDivider = block?.type === "divider";

                // Merge if at start (or block is empty/divider) with no selection
                if (
                    (cursorAtStart || isBlockEmpty || isDivider) &&
                    isCollapsed &&
                    blockIndex > 0
                ) {
                    e.preventDefault();
                    mergeWithPreviousBlock(blockId);
                }
            }

            // Arrow Up - Move to previous block
            if (e.key === "ArrowUp") {
                const blockIndex = blocks.findIndex((b) => b.id === blockId);

                if (blockIndex > 0) {
                    const prevBlock = blocks[blockIndex - 1];
                    setActiveBlock(prevBlock.id);
                }
            }

            // Arrow Down - Move to next block
            if (e.key === "ArrowDown") {
                const blockIndex = blocks.findIndex((b) => b.id === blockId);

                if (blockIndex < blocks.length - 1) {
                    const nextBlock = blocks[blockIndex + 1];
                    setActiveBlock(nextBlock.id);
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
            outdentBlock
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
                    setActiveBlock(lastBlock.id);
                }
            }
        },
        [blocks, setActiveBlock]
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
