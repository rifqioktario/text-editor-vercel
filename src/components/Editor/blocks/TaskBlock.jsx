import { useRef, useEffect, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "../../../utils/cn";

/**
 * TaskBlock - Checkbox with text content
 */
export function TaskBlock({
    id,
    content,
    properties,
    isActive,
    onContentChange,
    onPropertiesChange,
    onKeyDown,
    onFocus
}) {
    const contentRef = useRef(null);
    const isInitialMount = useRef(true);
    const isChecked = properties?.checked || false;

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

    // Toggle checkbox
    const handleCheckboxClick = useCallback(() => {
        onPropertiesChange(id, { checked: !isChecked });
    }, [id, isChecked, onPropertiesChange]);

    return (
        <div className="flex items-start gap-2 py-1">
            {/* Checkbox */}
            <button
                type="button"
                onClick={handleCheckboxClick}
                className={cn(
                    "shrink-0 mt-1",
                    "w-4 h-4 rounded",
                    "border transition-colors",
                    "flex items-center justify-center",
                    isChecked
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 hover:border-gray-400"
                )}
            >
                {isChecked && <Check className="w-3 h-3" />}
            </button>

            {/* Content */}
            <div
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                className={cn(
                    "flex-1 outline-none",
                    "min-h-[1.5em]",
                    "text-base leading-relaxed",
                    isChecked ? "text-gray-500 line-through" : "text-gray-900",
                    "empty:before:content-[attr(data-placeholder)]",
                    "empty:before:text-gray-400",
                    "empty:before:pointer-events-none",
                    isActive && "bg-blue-50/30"
                )}
                data-placeholder="Task..."
                data-block-id={id}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
            />
        </div>
    );
}
