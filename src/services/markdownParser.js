/**
 * Markdown Parser using `marked` library
 * Converts Markdown string to document blocks
 */

import { marked } from "marked";
import { BLOCK_TYPES } from "../constants/BLOCK_TYPES";
import { v4 as uuidv4 } from "uuid";

// Configure marked for HTML output
marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: false // Don't add <br> on single newlines
});

/**
 * Create a new block
 */
function createBlock(type, content = "", properties = {}) {
    return {
        id: uuidv4(),
        type,
        content,
        properties
    };
}

/**
 * Convert marked token to block(s)
 */
function tokenToBlocks(token, blocks = []) {
    switch (token.type) {
        case "heading": {
            const headingTypes = {
                1: BLOCK_TYPES.HEADING_1,
                2: BLOCK_TYPES.HEADING_2,
                3: BLOCK_TYPES.HEADING_3
            };
            const hType = headingTypes[token.depth] || BLOCK_TYPES.HEADING_3;
            blocks.push(createBlock(hType, parseInlineTokens(token.tokens)));
            break;
        }

        case "paragraph":
            blocks.push(
                createBlock(
                    BLOCK_TYPES.PARAGRAPH,
                    parseInlineTokens(token.tokens)
                )
            );
            break;

        case "blockquote": {
            // Extract text from blockquote tokens
            const quoteContent = token.tokens
                .map((t) =>
                    t.type === "paragraph" ? parseInlineTokens(t.tokens) : t.raw
                )
                .join("\n");
            blocks.push(createBlock(BLOCK_TYPES.QUOTE, quoteContent));
            break;
        }

        case "list":
            token.items.forEach((item) => {
                if (item.task) {
                    // Task list item
                    const taskContent = item.tokens
                        .filter(
                            (t) => t.type === "text" || t.type === "paragraph"
                        )
                        .map((t) =>
                            t.tokens ? parseInlineTokens(t.tokens) : t.text
                        )
                        .join("");
                    blocks.push(
                        createBlock(BLOCK_TYPES.TASK, taskContent, {
                            checked: item.checked
                        })
                    );
                } else {
                    // Regular list item -> paragraph with bullet/number
                    const listContent = item.tokens
                        .filter(
                            (t) => t.type === "text" || t.type === "paragraph"
                        )
                        .map((t) =>
                            t.tokens ? parseInlineTokens(t.tokens) : t.text
                        )
                        .join("");
                    const prefix = token.ordered
                        ? `${item.raw.match(/^\d+/)?.[0] || "1"}. `
                        : "• ";
                    blocks.push(
                        createBlock(BLOCK_TYPES.PARAGRAPH, prefix + listContent)
                    );
                }
            });
            break;

        case "code":
            // Code blocks are converted to paragraph (CODE block type removed)
            blocks.push(
                createBlock(BLOCK_TYPES.PARAGRAPH, `<code>${token.text}</code>`)
            );
            break;

        case "hr":
            blocks.push(createBlock(BLOCK_TYPES.DIVIDER));
            break;

        case "table": {
            // Convert table to readable paragraphs
            // Header row
            if (token.header && token.header.length > 0) {
                const headerRow = token.header
                    .map((cell) => parseInlineTokens(cell.tokens))
                    .join(" | ");
                blocks.push(
                    createBlock(
                        BLOCK_TYPES.PARAGRAPH,
                        `<strong>${headerRow}</strong>`
                    )
                );
            }
            // Data rows
            token.rows.forEach((row) => {
                const rowContent = row
                    .map((cell) => parseInlineTokens(cell.tokens))
                    .join(" | ");
                blocks.push(createBlock(BLOCK_TYPES.PARAGRAPH, rowContent));
            });
            break;
        }

        case "image":
            blocks.push(
                createBlock(BLOCK_TYPES.IMAGE, "", {
                    url: token.href,
                    alt: token.text || "",
                    caption: token.title || ""
                })
            );
            break;

        case "html":
            // Pass through HTML as paragraph
            if (token.text.trim()) {
                blocks.push(createBlock(BLOCK_TYPES.PARAGRAPH, token.text));
            }
            break;

        case "space":
            // Ignore whitespace-only tokens
            break;

        default:
            // Fallback for unknown types
            if (token.raw && token.raw.trim()) {
                blocks.push(createBlock(BLOCK_TYPES.PARAGRAPH, token.raw));
            }
    }

    return blocks;
}

/**
 * Parse inline tokens to HTML string
 */
function parseInlineTokens(tokens) {
    if (!tokens || !Array.isArray(tokens)) return "";

    return tokens
        .map((token) => {
            switch (token.type) {
                case "text":
                    return token.text;
                case "strong":
                    return `<strong>${parseInlineTokens(token.tokens)}</strong>`;
                case "em":
                    return `<em>${parseInlineTokens(token.tokens)}</em>`;
                case "del":
                    return `<s>${parseInlineTokens(token.tokens)}</s>`;
                case "link":
                    return `<a href="${token.href}">${parseInlineTokens(token.tokens)}</a>`;
                case "codespan":
                    return `<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${token.text}</code>`;
                case "br":
                    return "<br>";
                case "escape":
                    return token.text;
                default:
                    return token.raw || token.text || "";
            }
        })
        .join("");
}

/**
 * Parse Markdown string to document blocks
 * @param {string} markdown - Markdown string
 * @returns {Object} Document object with blocks
 */
export function parseMarkdown(markdown) {
    if (!markdown || typeof markdown !== "string") {
        return {
            id: uuidv4(),
            title: "Imported Document",
            blocks: [createBlock(BLOCK_TYPES.PARAGRAPH, "")],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    // Preprocess: Normalize line endings and join continuation lines
    let normalized = markdown
        // Normalize Windows line endings
        .replace(/\r\n/g, "\n")
        // Normalize Mac line endings
        .replace(/\r/g, "\n");

    // Join lines that should be together (single newline without blank line)
    // but preserve intentional line breaks (double newlines, headings, lists, etc.)
    normalized = normalized
        .split(/\n\n+/) // Split on double (or more) newlines
        .map((block) => {
            // Within each block, check if lines should be joined
            // Keep lines separate if they're special Markdown (headings, lists, etc.)
            const lines = block.split("\n");
            const joined = [];
            let currentLine = "";

            for (const line of lines) {
                const trimmed = line.trim();

                // Check if line is a special Markdown element (should be its own block)
                const isSpecialLine =
                    /^#{1,6}\s/.test(trimmed) || // Headings
                    /^>\s/.test(trimmed) || // Blockquotes
                    /^[-*+]\s/.test(trimmed) || // Lists
                    /^\d+[.)]\s/.test(trimmed) || // Numbered lists
                    /^```/.test(trimmed) || // Code blocks
                    /^---$|^\*\*\*$|^___$/.test(trimmed) || // Horizontal rules
                    /^\|.*\|$/.test(trimmed); // Tables

                if (isSpecialLine) {
                    // Save current accumulated line
                    if (currentLine) {
                        joined.push(currentLine.trim());
                        currentLine = "";
                    }
                    joined.push(line);
                } else if (trimmed === "") {
                    // Empty line - preserve as paragraph break
                    if (currentLine) {
                        joined.push(currentLine.trim());
                        currentLine = "";
                    }
                } else {
                    // Regular text - join with previous line
                    currentLine = currentLine
                        ? currentLine + " " + trimmed
                        : trimmed;
                }
            }

            if (currentLine) {
                joined.push(currentLine.trim());
            }

            return joined.join("\n");
        })
        .join("\n\n");

    // Use marked's lexer to tokenize
    const tokens = marked.lexer(normalized);
    const blocks = [];
    let title = "Imported Document";
    let foundTitle = false;

    // Process each token
    for (const token of tokens) {
        // First H1 becomes document title
        if (!foundTitle && token.type === "heading" && token.depth === 1) {
            title = token.text;
            foundTitle = true;
            continue;
        }

        tokenToBlocks(token, blocks);
    }

    // Ensure at least one block
    if (blocks.length === 0) {
        blocks.push(createBlock(BLOCK_TYPES.PARAGRAPH, ""));
    }

    return {
        id: uuidv4(),
        title,
        blocks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

/**
 * Read file and parse as Markdown
 * @param {File} file - File object
 * @returns {Promise<Object>} Document object
 */
export function parseMarkdownFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const markdown = e.target.result;
                const document = parseMarkdown(markdown);
                if (document.title === "Imported Document") {
                    document.title = file.name.replace(
                        /\.(md|txt|markdown)$/i,
                        ""
                    );
                }
                resolve(document);
            } catch {
                reject(new Error("Failed to parse Markdown file"));
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
    });
}
