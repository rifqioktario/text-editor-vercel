import { useRef, useEffect, useCallback } from "react";
import { cn } from "../../../utils/cn";

/**
 * QuoteBlock - Blockquote with left border styling
 */
export function QuoteBlock({
    id,
    content,
    isActive,
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
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(contentRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isActive]);

    // Handle input changes
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
            className={cn(
                "border-l-4 border-gray-300",
                "pl-4 py-1",
                "italic text-gray-600"
            )}
        >
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                className={cn(
                    "outline-none",
                    "min-h-[1.5em]",
                    "text-base leading-relaxed",
                    "empty:before:content-[attr(data-placeholder)]",
                    "empty:before:text-gray-400",
                    "empty:before:pointer-events-none",
                    isActive && "bg-blue-50/30"
                )}
                data-placeholder="Quote..."
                data-block-id={id}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
            />
        </div>
    );
}
