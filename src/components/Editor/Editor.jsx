import { useCallback } from "react";
import { useEditorStore } from "../../stores/editorStore";
import { EditorCanvas } from "./EditorCanvas";
import { BottomToolbar } from "./BottomToolbar";
import { useTextSelection } from "../../hooks/useTextSelection";
import { cn } from "../../utils/cn";

/**
 * Editor - Main editor container
 */
export function Editor() {
    const { activeBlockId, getBlockById, convertBlockType } = useEditorStore();

    // Track text selection
    const selection = useTextSelection();

    // Get active block type
    const activeBlock = activeBlockId ? getBlockById(activeBlockId) : null;
    const activeBlockType = activeBlock?.type || "paragraph";

    // Handle block type change from toolbar
    const handleBlockTypeChange = useCallback(
        (newType) => {
            if (activeBlockId) {
                convertBlockType(activeBlockId, newType);
            }
        },
        [activeBlockId, convertBlockType]
    );

    // Handle format toggle - apply formatting to selected text
    const handleFormatToggle = (format) => {
        if (!selection.hasSelection) return;

        // Map format names to execCommand commands
        const commandMap = {
            bold: "bold",
            italic: "italic",
            underline: "underline",
            strikethrough: "strikeThrough"
        };

        const command = commandMap[format];

        // Apply formatting
        if (format === "highlight") {
            // Check if selection is inside a highlight span
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            let container = range.commonAncestorContainer;
            if (container.nodeType === 3) container = container.parentElement;

            // Look for existing highlight span (yellow background)
            let highlightSpan = null;
            let el = container;
            while (el && el !== document.body) {
                const bg = el.style?.backgroundColor;
                if (bg === "rgb(254, 240, 138)" || bg === "#fef08a") {
                    highlightSpan = el;
                    break;
                }
                el = el.parentElement;
            }

            if (highlightSpan) {
                // Remove highlight - unwrap the span
                const parent = highlightSpan.parentElement;
                while (highlightSpan.firstChild) {
                    parent.insertBefore(
                        highlightSpan.firstChild,
                        highlightSpan
                    );
                }
                parent.removeChild(highlightSpan);
            } else {
                // Add highlight
                document.execCommand("backColor", false, "#fef08a");
            }
        } else if (command) {
            document.execCommand(command, false, null);
        }
    };

    // Handle link insert
    const handleLinkInsert = () => {
        if (!selection.hasSelection) return;

        const url = prompt("Enter URL:", "https://");
        if (url) {
            document.execCommand("createLink", false, url);
        }
    };

    return (
        <div
            className={cn(
                "flex-1 h-full overflow-auto",
                "bg-gradient-to-br from-slate-50 via-white to-blue-50/30"
            )}
        >
            {/* Editor Canvas */}
            <main className="pb-24">
                <EditorCanvas />
            </main>

            {/* Bottom Toolbar */}
            <BottomToolbar
                activeBlockType={activeBlockType}
                hasSelection={selection.hasSelection}
                formatting={{}}
                onBlockTypeChange={handleBlockTypeChange}
                onFormatToggle={handleFormatToggle}
                onLinkInsert={handleLinkInsert}
            />
        </div>
    );
}
