import { useRef, useEffect, useCallback } from "react";
import { cn } from "../../../utils/cn";

/**
 * HeadingBlock - H1, H2, H3 heading blocks
 */
export function HeadingBlock({
    id,
    content,
    type, // 'heading1' | 'heading2' | 'heading3'
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
            contentRef.current.textContent = content;
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
            const newContent = e.currentTarget.textContent || "";
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

    // Get styles based on heading level
    const headingStyles = {
        heading1: "text-3xl font-bold",
        heading2: "text-2xl font-semibold",
        heading3: "text-xl font-medium"
    };

    const placeholders = {
        heading1: "Heading 1",
        heading2: "Heading 2",
        heading3: "Heading 3"
    };

    return (
        <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            className={cn(
                "outline-none",
                "min-h-[1.5em]",
                "py-1 px-0",
                "text-gray-900",
                headingStyles[type] || headingStyles.heading1,
                "empty:before:content-[attr(data-placeholder)]",
                "empty:before:text-gray-400",
                "empty:before:pointer-events-none",
                isActive && "bg-blue-50/30"
            )}
            data-placeholder={placeholders[type] || "Heading"}
            data-block-id={id}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
        />
    );
}
