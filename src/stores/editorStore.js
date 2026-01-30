import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
    createDocument,
    findBlockIndex,
    splitBlockAtCursor,
    mergeBlocks
} from "../utils/blocks";
import {
    BLOCK_TYPES,
    DEFAULT_BLOCK_PROPERTIES,
    createBlockProperties
} from "../constants/BLOCK_TYPES";

/**
 * Editor store using Zustand with Immer for immutable updates
 */
export const useEditorStore = create(
    immer((set, get) => ({
        // ========== State ==========
        document: createDocument("Untitled"),
        activeBlockId: null,
        selection: {
            anchor: { blockId: null, offset: 0 },
            focus: { blockId: null, offset: 0 }
        },

        // Selection state for Ctrl+A
        selectionLevel: 0, // 0: none, 1: block content, 2: block, 3: all blocks
        selectedBlockIds: [], // Array of selected block IDs

        // UI State
        isSlashMenuOpen: false,
        slashMenuPosition: { x: 0, y: 0 },
        isFloatingToolbarVisible: false,

        // History for undo/redo
        history: {
            past: [],
            future: []
        },
        maxHistorySize: 50,

        // ========== History Actions ==========

        /**
         * Save current state to history (call before making changes)
         */
        saveToHistory: () => {
            set((state) => {
                // Deep clone current blocks
                const snapshot = {
                    blocks: JSON.parse(JSON.stringify(state.document.blocks)),
                    activeBlockId: state.activeBlockId,
                    timestamp: Date.now()
                };

                state.history.past.push(snapshot);

                // Limit history size
                if (state.history.past.length > state.maxHistorySize) {
                    state.history.past.shift();
                }

                // Clear future on new action
                state.history.future = [];
            });
        },

        /**
         * Undo last action
         */
        undo: () => {
            const { history } = get();
            if (history.past.length === 0) return;

            set((state) => {
                // Save current state to future
                const currentSnapshot = {
                    blocks: JSON.parse(JSON.stringify(state.document.blocks)),
                    activeBlockId: state.activeBlockId,
                    timestamp: Date.now()
                };
                state.history.future.unshift(currentSnapshot);

                // Restore from past
                const previousState = state.history.past.pop();
                state.document.blocks = previousState.blocks;
                state.activeBlockId = previousState.activeBlockId;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        /**
         * Redo previously undone action
         */
        redo: () => {
            const { history } = get();
            if (history.future.length === 0) return;

            set((state) => {
                // Save current state to past
                const currentSnapshot = {
                    blocks: JSON.parse(JSON.stringify(state.document.blocks)),
                    activeBlockId: state.activeBlockId,
                    timestamp: Date.now()
                };
                state.history.past.push(currentSnapshot);

                // Restore from future
                const nextState = state.history.future.shift();
                state.document.blocks = nextState.blocks;
                state.activeBlockId = nextState.activeBlockId;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        // ========== Selection Actions ==========

        /**
         * Cycle selection level (for Ctrl+A)
         * Level 0: No selection
         * Level 1: Current block selected
         * Level 2: All blocks selected
         */
        cycleSelection: () => {
            set((state) => {
                const currentLevel = state.selectionLevel;
                // Only select top-level blocks (not nested blocks inside columns/tabs)
                const topLevelBlocks = state.document.blocks.filter(
                    (b) =>
                        b.columnIndex === undefined &&
                        b.parentTabId === undefined
                );

                if (currentLevel === 0) {
                    // Level 1: Select current block
                    state.selectionLevel = 1;
                    if (state.activeBlockId) {
                        state.selectedBlockIds = [state.activeBlockId];
                    }
                } else if (currentLevel === 1) {
                    // Level 2: Select all top-level blocks
                    state.selectionLevel = 2;
                    state.selectedBlockIds = topLevelBlocks.map((b) => b.id);
                } else {
                    // Reset to level 0
                    state.selectionLevel = 0;
                    state.selectedBlockIds = [];
                }
            });
        },

        /**
         * Clear selection
         */
        clearSelection: () => {
            set((state) => {
                state.selectionLevel = 0;
                state.selectedBlockIds = [];
            });
        },

        /**
         * Delete selected blocks
         */
        deleteSelectedBlocks: () => {
            const { selectedBlockIds } = get();
            if (selectedBlockIds.length === 0) return;

            get().saveToHistory();

            set((state) => {
                state.document.blocks = state.document.blocks.filter(
                    (b) => !state.selectedBlockIds.includes(b.id)
                );

                // Ensure at least one block remains
                if (state.document.blocks.length === 0) {
                    state.document.blocks = [
                        {
                            id: crypto.randomUUID(),
                            type: BLOCK_TYPES.PARAGRAPH,
                            content: "",
                            properties: {}
                        }
                    ];
                }

                // Set active to first remaining block
                state.activeBlockId = state.document.blocks[0].id;
                state.selectedBlockIds = [];
                state.selectionLevel = 0;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        // ========== Block Actions ==========

        /**
         * Set the active (focused) block
         */
        setActiveBlock: (blockId) => {
            set((state) => {
                state.activeBlockId = blockId;
                // Clear selection when focusing a new block
                if (state.selectionLevel > 0) {
                    state.selectionLevel = 0;
                    state.selectedBlockIds = [];
                }
            });
        },

        /**
         * Add a new block after the specified block
         */
        addBlockAfter: (afterBlockId, newBlock) => {
            set((state) => {
                const blocks = state.document.blocks;
                const index = findBlockIndex(blocks, afterBlockId);

                if (index !== -1) {
                    blocks.splice(index + 1, 0, newBlock);
                } else {
                    blocks.push(newBlock);
                }

                state.activeBlockId = newBlock.id;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        /**
         * Update a block's content
         */
        updateBlockContent: (blockId, content) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    block.content = content;
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Update a block's properties
         */
        updateBlockProperties: (blockId, properties) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    Object.assign(block.properties, properties);
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Update a block fully (properties, children, etc.)
         * Used for container blocks like Tabs and Columns
         */
        updateBlockFull: (blockId, updates) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    if (updates.properties) {
                        block.properties = {
                            ...block.properties,
                            ...updates.properties
                        };
                    }
                    if (updates.children !== undefined) {
                        block.children = updates.children;
                    }
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Update a block's type
         */
        updateBlockType: (blockId, newType) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    block.type = newType;
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Delete a block by ID
         */
        deleteBlock: (blockId) => {
            get().saveToHistory();
            set((state) => {
                const blocks = state.document.blocks;
                const index = findBlockIndex(blocks, blockId);

                if (index !== -1) {
                    blocks.splice(index, 1);

                    // If all blocks are deleted, ensure we have at least one paragraph
                    if (blocks.length === 0) {
                        const newBlock = {
                            id: crypto.randomUUID(),
                            type: BLOCK_TYPES.PARAGRAPH,
                            content: "",
                            properties: {}
                        };
                        blocks.push(newBlock);
                        state.activeBlockId = newBlock.id;
                    } else {
                        // Set active to previous block or first block
                        const newActiveIndex = Math.max(0, index - 1);
                        state.activeBlockId = blocks[newActiveIndex].id;
                    }

                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Split a block at cursor position (for Enter key)
         */
        splitBlock: (blockId, cursorPosition) => {
            get().saveToHistory();
            set((state) => {
                const blocks = state.document.blocks;
                const index = findBlockIndex(blocks, blockId);
                const block = blocks[index];

                if (block) {
                    const [blockBefore, blockAfter] = splitBlockAtCursor(
                        block,
                        cursorPosition
                    );

                    blocks[index] = blockBefore;
                    blocks.splice(index + 1, 0, blockAfter);

                    state.activeBlockId = blockAfter.id;
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Merge current block with previous block (for Backspace at start)
         */
        mergeWithPreviousBlock: (blockId) => {
            get().saveToHistory();
            set((state) => {
                const blocks = state.document.blocks;
                const index = findBlockIndex(blocks, blockId);

                if (index > 0) {
                    const currentBlock = blocks[index];
                    const previousBlock = blocks[index - 1];

                    const mergedBlock = mergeBlocks(
                        previousBlock,
                        currentBlock
                    );

                    blocks[index - 1] = mergedBlock;
                    blocks.splice(index, 1);

                    state.activeBlockId = mergedBlock.id;
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Convert a block to a different type
         */
        convertBlockType: (blockId, newType, newContent = null) => {
            get().saveToHistory();
            set((state) => {
                const blocks = state.document.blocks;
                const block = blocks.find((b) => b.id === blockId);

                if (block) {
                    block.type = newType;
                    // Use factory function for types that need generated IDs
                    if (
                        newType === BLOCK_TYPES.TABS ||
                        newType === BLOCK_TYPES.COLUMNS
                    ) {
                        block.properties = createBlockProperties(newType);
                    } else {
                        block.properties = {
                            ...DEFAULT_BLOCK_PROPERTIES[newType]
                        };
                    }
                    if (newContent !== null) {
                        block.content = newContent;
                    }
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Move a block to a new position
         */
        moveBlock: (blockId, toIndex) => {
            get().saveToHistory();
            set((state) => {
                const blocks = state.document.blocks;
                const fromIndex = findBlockIndex(blocks, blockId);

                if (fromIndex !== -1 && fromIndex !== toIndex) {
                    const [removed] = blocks.splice(fromIndex, 1);
                    blocks.splice(toIndex, 0, removed);
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Duplicate a block
         */
        duplicateBlock: (blockId) => {
            set((state) => {
                const blocks = state.document.blocks;
                const index = findBlockIndex(blocks, blockId);
                const block = blocks[index];

                if (block) {
                    const duplicated = {
                        ...block,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString()
                    };

                    blocks.splice(index + 1, 0, duplicated);
                    state.activeBlockId = duplicated.id;
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Indent a block (increase nesting level)
         * Max indent level is 3
         */
        indentBlock: (blockId) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    const currentIndent = block.properties?.indent || 0;
                    if (currentIndent < 3) {
                        block.properties = {
                            ...block.properties,
                            indent: currentIndent + 1
                        };
                        state.document.updatedAt = new Date().toISOString();
                    }
                }
            });
        },

        /**
         * Outdent a block (decrease nesting level)
         * Min indent level is 0
         */
        outdentBlock: (blockId) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    const currentIndent = block.properties?.indent || 0;
                    if (currentIndent > 0) {
                        block.properties = {
                            ...block.properties,
                            indent: currentIndent - 1
                        };
                        state.document.updatedAt = new Date().toISOString();
                    }
                }
            });
        },

        // ========== Nested Block Actions ==========

        /**
         * Add a block to a column in a Columns block
         */
        addBlockToColumn: (columnsBlockId, columnIndex, newBlockData) => {
            get().saveToHistory();
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === columnsBlockId
                );
                if (!block || block.type !== BLOCK_TYPES.COLUMNS) return;

                // Initialize children array if needed
                if (!block.children) {
                    block.children = [];
                }

                // Create new block
                const newBlock = {
                    id: crypto.randomUUID(),
                    type: newBlockData.type || BLOCK_TYPES.PARAGRAPH,
                    content: newBlockData.content || "",
                    properties: newBlockData.properties || {},
                    columnIndex
                };

                // Find or create column entry
                let column = block.children.find(
                    (c) => c.columnIndex === columnIndex
                );
                if (!column) {
                    column = { columnIndex, blocks: [] };
                    block.children.push(column);
                }

                column.blocks.push(newBlock.id);

                // Store the actual block in document
                state.document.blocks.push(newBlock);
                state.activeBlockId = newBlock.id;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        /**
         * Add a block to a tab in a Tabs block
         */
        addBlockToTab: (tabsBlockId, tabId, newBlockData) => {
            get().saveToHistory();
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === tabsBlockId
                );
                if (!block || block.type !== BLOCK_TYPES.TABS) return;

                // Initialize children object if needed
                if (!block.children) {
                    block.children = {};
                }

                // Create new block
                const newBlock = {
                    id: crypto.randomUUID(),
                    type: newBlockData.type || BLOCK_TYPES.PARAGRAPH,
                    content: newBlockData.content || "",
                    properties: newBlockData.properties || {},
                    parentTabId: tabId
                };

                // Initialize tab blocks array if needed
                if (!block.children[tabId]) {
                    block.children[tabId] = [];
                }

                block.children[tabId].push(newBlock.id);

                // Store the actual block in document
                state.document.blocks.push(newBlock);
                state.activeBlockId = newBlock.id;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        /**
         * Update a block inside a container (Column/Tab)
         */
        updateNestedBlock: (blockId, updates) => {
            set((state) => {
                const block = state.document.blocks.find(
                    (b) => b.id === blockId
                );
                if (block) {
                    Object.assign(block, updates);
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        // ========== Document Actions ==========

        /**
         * Update document title
         */
        setDocumentTitle: (title) => {
            set((state) => {
                state.document.title = title;
                state.document.updatedAt = new Date().toISOString();
            });
        },

        /**
         * Load a document
         */
        loadDocument: (document) => {
            set((state) => {
                state.document = document;
                state.activeBlockId = document.blocks[0]?.id || null;
            });
        },

        /**
         * Create a new empty document
         */
        newDocument: () => {
            set((state) => {
                state.document = createDocument("Untitled");
                state.activeBlockId = state.document.blocks[0]?.id || null;
            });
        },

        // ========== UI Actions ==========

        /**
         * Open slash menu at position
         */
        openSlashMenu: (position) => {
            set((state) => {
                state.isSlashMenuOpen = true;
                state.slashMenuPosition = position;
            });
        },

        /**
         * Close slash menu
         */
        closeSlashMenu: () => {
            set((state) => {
                state.isSlashMenuOpen = false;
            });
        },

        /**
         * Show/hide floating toolbar
         */
        setFloatingToolbarVisible: (visible) => {
            set((state) => {
                state.isFloatingToolbarVisible = visible;
            });
        },

        /**
         * Update selection state
         */
        setSelection: (selection) => {
            set((state) => {
                state.selection = selection;
            });
        },

        // ========== Getters ==========

        /**
         * Get blocks array
         */
        getBlocks: () => get().document.blocks,

        /**
         * Get a block by ID
         */
        getBlockById: (blockId) => {
            return get().document.blocks.find((b) => b.id === blockId);
        },

        /**
         * Get the index of a block
         */
        getBlockIndex: (blockId) => {
            return findBlockIndex(get().document.blocks, blockId);
        },

        /**
         * Insert multiple blocks at a position (for paste)
         */
        insertBlocksAtPosition: (afterBlockId, newBlocks) => {
            if (!newBlocks || newBlocks.length === 0) return;

            set((state) => {
                const blocks = state.document.blocks;
                const index = afterBlockId
                    ? findBlockIndex(blocks, afterBlockId)
                    : blocks.length - 1;

                if (index !== -1) {
                    // Insert all new blocks after the specified position
                    blocks.splice(index + 1, 0, ...newBlocks);
                    // Set active to last inserted block
                    state.activeBlockId = newBlocks[newBlocks.length - 1].id;
                } else {
                    blocks.push(...newBlocks);
                    state.activeBlockId = newBlocks[newBlocks.length - 1].id;
                }

                state.document.updatedAt = new Date().toISOString();
            });
        },

        /**
         * Get the active block
         */
        getActiveBlock: () => {
            const { document, activeBlockId } = get();
            return document.blocks.find((b) => b.id === activeBlockId);
        }
    }))
);
