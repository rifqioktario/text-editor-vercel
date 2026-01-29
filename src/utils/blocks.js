import {
    BLOCK_TYPES,
    DEFAULT_BLOCK_PROPERTIES
} from "../constants/BLOCK_TYPES";

/**
 * Create a new block with default properties
 */
export function createBlock(type = BLOCK_TYPES.PARAGRAPH, content = "") {
    return {
        id: crypto.randomUUID(),
        type,
        content,
        properties: { ...DEFAULT_BLOCK_PROPERTIES[type] },
        children: [],
        createdAt: new Date().toISOString()
    };
}

/**
 * Create a new document with a default empty block
 */
export function createDocument(title = "Untitled") {
    return {
        id: crypto.randomUUID(),
        title,
        icon: "📄",
        groupId: null,
        blocks: [createBlock(BLOCK_TYPES.PARAGRAPH, "")],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Find the index of a block by its ID
 */
export function findBlockIndex(blocks, blockId) {
    return blocks.findIndex((block) => block.id === blockId);
}

/**
 * Find a block by its ID
 */
export function findBlockById(blocks, blockId) {
    return blocks.find((block) => block.id === blockId);
}

/**
 * Split a block at the cursor position
 * Returns [blockBefore, blockAfter]
 */
export function splitBlockAtCursor(block, cursorPosition) {
    const contentBefore = block.content.slice(0, cursorPosition);
    const contentAfter = block.content.slice(cursorPosition);

    const blockBefore = {
        ...block,
        content: contentBefore
    };

    const blockAfter = createBlock(BLOCK_TYPES.PARAGRAPH, contentAfter);

    return [blockBefore, blockAfter];
}

/**
 * Merge two blocks into one
 * The second block's content is appended to the first
 */
export function mergeBlocks(blockA, blockB) {
    return {
        ...blockA,
        content: blockA.content + blockB.content
    };
}

/**
 * Check if a block is empty (no content)
 */
export function isBlockEmpty(block) {
    return block.content.trim() === "";
}

/**
 * Convert block type while preserving content
 */
export function convertBlockType(block, newType) {
    return {
        ...block,
        type: newType,
        properties: { ...DEFAULT_BLOCK_PROPERTIES[newType] }
    };
}

/**
 * Get the previous block in the list
 */
export function getPreviousBlock(blocks, currentBlockId) {
    const index = findBlockIndex(blocks, currentBlockId);
    if (index <= 0) return null;
    return blocks[index - 1];
}

/**
 * Get the next block in the list
 */
export function getNextBlock(blocks, currentBlockId) {
    const index = findBlockIndex(blocks, currentBlockId);
    if (index === -1 || index >= blocks.length - 1) return null;
    return blocks[index + 1];
}

/**
 * Duplicate a block with a new ID
 */
export function duplicateBlock(block) {
    return {
        ...block,
        id: crypto.randomUUID(),
        properties: { ...block.properties },
        children: [...block.children],
        createdAt: new Date().toISOString()
    };
}

/**
 * Reorder blocks by moving a block to a new position
 */
export function reorderBlocks(blocks, fromIndex, toIndex) {
    const result = [...blocks];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
}
