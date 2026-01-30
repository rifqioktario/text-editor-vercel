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
    IMAGE: "image",
    DIVIDER: "divider",
    LINK: "link",
    // Advanced block types
    SECTION: "section",
    GALLERY: "gallery",
    COLUMNS: "columns",
    TABS: "tabs"
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
    },
    [BLOCK_TYPES.SECTION]: {
        label: "Section",
        description: "Section divider with title",
        icon: "SeparatorHorizontal",
        shortcut: "---"
    },
    [BLOCK_TYPES.GALLERY]: {
        label: "Gallery",
        description: "Image gallery carousel",
        icon: "Images",
        shortcut: null
    },
    [BLOCK_TYPES.COLUMNS]: {
        label: "Columns",
        description: "Multi-column layout",
        icon: "Columns2",
        shortcut: null
    },
    [BLOCK_TYPES.TABS]: {
        label: "Tabs",
        description: "Tabbed content sections",
        icon: "PanelTop",
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
    [BLOCK_TYPES.IMAGE]: { url: "", alt: "", caption: "" },
    [BLOCK_TYPES.DIVIDER]: {},
    [BLOCK_TYPES.LINK]: { url: "", title: "" },
    [BLOCK_TYPES.SECTION]: { title: "" },
    [BLOCK_TYPES.GALLERY]: { images: [], aspectRatio: "portrait" },
    [BLOCK_TYPES.COLUMNS]: { count: 2, widths: [50, 50], gap: 16 },
    [BLOCK_TYPES.TABS]: { tabs: [], activeTabId: null }
};

/**
 * Factory function to create block properties with generated IDs
 * Call this when creating new blocks of these types
 */
export function createBlockProperties(type) {
    const defaultProps = { ...DEFAULT_BLOCK_PROPERTIES[type] };

    if (type === BLOCK_TYPES.TABS) {
        const tabId = crypto.randomUUID();
        defaultProps.tabs = [{ id: tabId, label: "Tab 1" }];
        defaultProps.activeTabId = tabId;
    }

    return defaultProps;
}
