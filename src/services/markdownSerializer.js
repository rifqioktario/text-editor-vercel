/**
 * Markdown Serializer
 * Converts document blocks to Markdown string
 */

import { BLOCK_TYPES } from "../constants/BLOCK_TYPES";

/**
 * Convert HTML inline formatting to Markdown
 * @param {string} html - HTML string with inline formatting
 * @returns {string} Markdown string
 */
function htmlToMarkdown(html) {
    if (!html) return "";

    let md = html;

    // Replace <strong> and <b> with **
    md = md.replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, "**$2**");

    // Replace <em> and <i> with *
    md = md.replace(/<(em|i)>(.*?)<\/(em|i)>/gi, "*$2*");

    // Replace <s>, <strike>, <del> with ~~
    md = md.replace(/<(s|strike|del)>(.*?)<\/(s|strike|del)>/gi, "~~$2~~");

    // Replace <u> - no standard MD, keep as HTML
    // md = md.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");

    // Replace <a href="url">text</a> with [text](url)
    md = md.replace(/<a\s+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");

    // Replace <mark> with ==highlight==
    md = md.replace(
        /<mark[^>]*style="[^"]*background[^"]*"[^>]*>(.*?)<\/mark>/gi,
        "==$1=="
    );
    md = md.replace(
        /<span[^>]*style="[^"]*background[^"]*"[^>]*>(.*?)<\/span>/gi,
        "==$1=="
    );

    // Remove remaining HTML tags (like <br>, <div>, etc.)
    md = md.replace(/<br\s*\/?>/gi, "\n");
    md = md.replace(/<div>/gi, "\n");
    md = md.replace(/<\/div>/gi, "");
    md = md.replace(/<[^>]+>/g, "");

    // Decode HTML entities
    md = md.replace(/&nbsp;/g, " ");
    md = md.replace(/&amp;/g, "&");
    md = md.replace(/&lt;/g, "<");
    md = md.replace(/&gt;/g, ">");
    md = md.replace(/&quot;/g, '"');

    return md;
}

/**
 * Serialize a single block to Markdown
 * @param {Object} block - Block object
 * @returns {string} Markdown string
 */
function serializeBlock(block) {
    const content = htmlToMarkdown(block.content || "");
    const indent = "  ".repeat(block.properties?.indent || 0);

    switch (block.type) {
        case BLOCK_TYPES.PARAGRAPH:
            return content ? `${indent}${content}\n\n` : "\n";

        case BLOCK_TYPES.HEADING_1:
            return `# ${content}\n\n`;

        case BLOCK_TYPES.HEADING_2:
            return `## ${content}\n\n`;

        case BLOCK_TYPES.HEADING_3:
            return `### ${content}\n\n`;

        case BLOCK_TYPES.TASK: {
            const checked = block.properties?.checked ? "x" : " ";
            return `${indent}- [${checked}] ${content}\n`;
        }

        case BLOCK_TYPES.QUOTE:
            return `> ${content}\n\n`;

        case BLOCK_TYPES.DIVIDER:
            return "---\n\n";

        case BLOCK_TYPES.IMAGE: {
            const { url = "", alt = "", caption = "" } = block.properties || {};
            let md = `![${alt}](${url})`;
            if (caption) {
                md += `\n*${caption}*`;
            }
            return md + "\n\n";
        }

        case BLOCK_TYPES.LINK: {
            const { url = "", title = "" } = block.properties || {};
            return `[${title || url}](${url})\n\n`;
        }

        default:
            return content ? `${content}\n\n` : "";
    }
}

/**
 * Serialize entire document to Markdown
 * @param {Object} document - Document object with blocks array
 * @returns {string} Complete Markdown string
 */
export function serializeDocument(document) {
    if (!document || !document.blocks) {
        return "";
    }

    // Optional: Add title as H1 if present
    let markdown = "";
    if (document.title) {
        markdown += `# ${document.title}\n\n`;
    }

    // Serialize each block
    for (const block of document.blocks) {
        markdown += serializeBlock(block);
    }

    // Clean up excessive newlines
    markdown = markdown.replace(/\n{3,}/g, "\n\n");

    return markdown.trim() + "\n";
}

/**
 * Serialize specific blocks to Markdown
 * @param {Array} blocks - Array of block objects
 * @returns {string} Markdown string
 */
export function serializeBlocks(blocks) {
    if (!blocks || !blocks.length) return "";
    return blocks
        .map((block) => serializeBlock(block))
        .join("")
        .trim();
}

/**
 * Convert document to plain text (no formatting)
 * @param {Object} document - Document object
 * @returns {string} Plain text string
 */
export function documentToPlainText(document) {
    if (!document || !document.blocks) {
        return "";
    }

    const lines = [];

    if (document.title) {
        lines.push(document.title);
        lines.push("");
    }

    for (const block of document.blocks) {
        let content = htmlToMarkdown(block.content || "");
        // Strip remaining markdown syntax for plain text
        content = content.replace(/\*\*/g, "");
        content = content.replace(/\*/g, "");
        content = content.replace(/~~/g, "");
        content = content.replace(/==/g, "");
        content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

        switch (block.type) {
            case BLOCK_TYPES.TASK: {
                const checked = block.properties?.checked ? "☑" : "☐";
                lines.push(`${checked} ${content}`);
                break;
            }
            case BLOCK_TYPES.QUOTE:
                lines.push(`"${content}"`);
                break;
            case BLOCK_TYPES.DIVIDER:
                lines.push("───────────");
                break;
            default:
                if (content) lines.push(content);
        }
    }

    return lines.join("\n");
}

/**
 * Download document as Markdown file
 * @param {Object} document - Document object
 */
export function downloadAsMarkdown(document) {
    const markdown = serializeDocument(document);
    const filename = `${document.title || "Untitled"}.md`;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
}

/**
 * Copy document as Markdown to clipboard
 * @param {Object} document - Document object
 * @returns {Promise<void>}
 */
export async function copyAsMarkdown(document) {
    const markdown = serializeDocument(document);
    await navigator.clipboard.writeText(markdown);
}

/**
 * Copy document as plain text to clipboard
 * @param {Object} document - Document object
 * @returns {Promise<void>}
 */
export async function copyAsPlainText(document) {
    const text = documentToPlainText(document);
    await navigator.clipboard.writeText(text);
}
