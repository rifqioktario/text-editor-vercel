/**
 * Block type constants
 * Each block type maps to a specific component and markdown output
 */
export const BLOCK_TYPES = {
    PARAGRAPH: "paragraph",
    HEADING_1: "heading1",
    HEADING_2: "heading2",
    HEADING_3: "heading3",
    TASK: "task",
    QUOTE: "quote",
    CODE: "code",
    IMAGE: "image",
    DIVIDER: "divider",
    LINK: "link"
};

/**
 * Block type metadata for UI display
 */
export const BLOCK_TYPE_INFO = {
    [BLOCK_TYPES.PARAGRAPH]: {
        label: "Text",
        description: "Plain text paragraph",
        icon: "Type",
        shortcut: null
    },
    [BLOCK_TYPES.HEADING_1]: {
        label: "Heading 1",
        description: "Large section heading",
        icon: "Heading1",
        shortcut: "#"
    },
    [BLOCK_TYPES.HEADING_2]: {
        label: "Heading 2",
        description: "Medium section heading",
        icon: "Heading2",
        shortcut: "##"
    },
    [BLOCK_TYPES.HEADING_3]: {
        label: "Heading 3",
        description: "Small section heading",
        icon: "Heading3",
        shortcut: "###"
    },
    [BLOCK_TYPES.TASK]: {
        label: "Task",
        description: "Checkbox item",
        icon: "CheckSquare",
        shortcut: "[]"
    },
    [BLOCK_TYPES.QUOTE]: {
        label: "Quote",
        description: "Blockquote",
        icon: "Quote",
        shortcut: ">"
    },
    [BLOCK_TYPES.CODE]: {
        label: "Code",
        description: "Code block with syntax highlighting",
        icon: "Code",
        shortcut: "```"
    },
    [BLOCK_TYPES.IMAGE]: {
        label: "Image",
        description: "Embed an image",
        icon: "Image",
        shortcut: null
    },
    [BLOCK_TYPES.DIVIDER]: {
        label: "Divider",
        description: "Horizontal line separator",
        icon: "Minus",
        shortcut: "---"
    },
    [BLOCK_TYPES.LINK]: {
        label: "Link",
        description: "Web link",
        icon: "Link",
        shortcut: null
    }
};

/**
 * Default properties for each block type
 */
export const DEFAULT_BLOCK_PROPERTIES = {
    [BLOCK_TYPES.PARAGRAPH]: {},
    [BLOCK_TYPES.HEADING_1]: {},
    [BLOCK_TYPES.HEADING_2]: {},
    [BLOCK_TYPES.HEADING_3]: {},
    [BLOCK_TYPES.TASK]: { checked: false },
    [BLOCK_TYPES.QUOTE]: {},
    [BLOCK_TYPES.CODE]: { language: "javascript" },
    [BLOCK_TYPES.IMAGE]: { url: "", alt: "", caption: "" },
    [BLOCK_TYPES.DIVIDER]: {},
    [BLOCK_TYPES.LINK]: { url: "", title: "" }
};
