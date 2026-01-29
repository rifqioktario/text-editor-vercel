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
    DEFAULT_BLOCK_PROPERTIES
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

        // UI State
        isSlashMenuOpen: false,
        slashMenuPosition: { x: 0, y: 0 },
        isFloatingToolbarVisible: false,

        // History for undo/redo
        history: {
            past: [],
            future: []
        },

        // ========== Block Actions ==========

        /**
         * Set the active (focused) block
         */
        setActiveBlock: (blockId) => {
            set((state) => {
                state.activeBlockId = blockId;
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
            set((state) => {
                const blocks = state.document.blocks;
                const index = findBlockIndex(blocks, blockId);

                if (index !== -1 && blocks.length > 1) {
                    blocks.splice(index, 1);

                    // Set active to previous block or first block
                    const newActiveIndex = Math.max(0, index - 1);
                    state.activeBlockId = blocks[newActiveIndex].id;
                    state.document.updatedAt = new Date().toISOString();
                }
            });
        },

        /**
         * Split a block at cursor position (for Enter key)
         */
        splitBlock: (blockId, cursorPosition) => {
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
            set((state) => {
                const blocks = state.document.blocks;
                const block = blocks.find((b) => b.id === blockId);

                if (block) {
                    block.type = newType;
                    block.properties = { ...DEFAULT_BLOCK_PROPERTIES[newType] };
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
         * Get the active block
         */
        getActiveBlock: () => {
            const { document, activeBlockId } = get();
            return document.blocks.find((b) => b.id === activeBlockId);
        }
    }))
);
