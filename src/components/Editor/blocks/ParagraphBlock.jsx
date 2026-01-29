import { useRef, useEffect, useCallback } from "react";
import { cn } from "../../../utils/cn";

/**
 * ParagraphBlock - Basic text block with contenteditable
 *
 * Uses uncontrolled contentEditable to avoid cursor jumping issues.
 * Content is synced via onInput, but we don't re-render the DOM content.
 */
export function ParagraphBlock({
    id,
    content,
    isActive,
    showPlaceholder,
    onContentChange,
    onKeyDown,
    onFocus
}) {
    const contentRef = useRef(null);
    const isInitialMount = useRef(true);

    // Set initial content only on mount
    useEffect(() => {
        if (isInitialMount.current && contentRef.current) {
            contentRef.current.innerHTML = content;
            isInitialMount.current = false;
        }
    }, [content]);

    // Focus when block becomes active
    useEffect(() => {
        if (isActive && contentRef.current) {
            contentRef.current.focus();
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(contentRef.current);
            range.collapse(false); // false = collapse to end
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isActive]);

    // Handle input changes - sync to store without re-rendering
    const handleInput = useCallback(
        (e) => {
            const newContent = e.currentTarget.innerHTML || "";
            onContentChange(id, newContent);
        },
        [id, onContentChange]
    );

    // Handle key events
    const handleKeyDown = useCallback(
        (e) => {
            onKeyDown(e, id, contentRef.current);
        },
        [id, onKeyDown]
    );

    // Handle focus
    const handleFocus = useCallback(() => {
        onFocus(id);
    }, [id, onFocus]);

    return (
        <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className={cn(
                "outline-none",
                "min-h-[1.5em]",
                "py-1 px-0",
                "text-base leading-relaxed",
                "text-gray-900",
                showPlaceholder &&
                    "empty:before:content-[attr(data-placeholder)]",
                showPlaceholder && "empty:before:text-gray-400",
                showPlaceholder && "empty:before:pointer-events-none",
                isActive && "bg-blue-50/30"
            )}
            data-placeholder={showPlaceholder ? "Type '/' for commands..." : ""}
            data-block-id={id}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
        />
    );
}
