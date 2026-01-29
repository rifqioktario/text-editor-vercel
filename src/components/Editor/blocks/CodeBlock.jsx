import { useRef, useEffect, useCallback } from "react";
import { cn } from "../../../utils/cn";

/**
 * CodeBlock - Code block with syntax highlighting
 */
export function CodeBlock({
    id,
    content,
    properties,
    isActive,
    onContentChange,
    onPropertiesChange,
    onKeyDown,
    onFocus
}) {
    const textareaRef = useRef(null);
    const initialContentRef = useRef(content);

    // Set initial content on mount only (uncontrolled)
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.value = initialContentRef.current || "";
        }
    }, []); // Only on mount

    // Focus when active
    useEffect(() => {
        if (isActive && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isActive]);

    // Handle input
    const handleInput = useCallback(
        (e) => {
            onContentChange(id, e.target.value);
        },
        [id, onContentChange]
    );

    // Handle key down
    const handleKeyDown = useCallback(
        (e) => {
            const textarea = textareaRef.current;

            // Tab inserts spaces instead of changing focus
            if (e.key === "Tab") {
                e.preventDefault();
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const value = textarea.value;

                    // Insert 2 spaces
                    textarea.value =
                        value.substring(0, start) + "  " + value.substring(end);
                    textarea.selectionStart = textarea.selectionEnd = start + 2;

                    // Update store
                    onContentChange(id, textarea.value);
                }
                return;
            }

            // Backspace at the start of empty block - let parent handle deletion
            if (e.key === "Backspace") {
                const isEmpty = !textarea?.value || textarea.value.length === 0;
                const cursorAtStart =
                    textarea?.selectionStart === 0 &&
                    textarea?.selectionEnd === 0;

                if (isEmpty || cursorAtStart) {
                    // Pass to parent for potential block merge/deletion
                    onKeyDown(e, id);
                    return;
                }
            }

            // Enter without shift - let parent handle if content is empty
            if (e.key === "Enter" && !e.shiftKey) {
                // Allow newlines in code blocks, don't pass to parent unless Ctrl/Cmd is held
                if (e.ctrlKey || e.metaKey) {
                    onKeyDown(e, id);
                    return;
                }
                // Otherwise, let the default textarea behavior handle it
                return;
            }

            // Arrow keys at boundaries - let parent handle navigation
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                // Let parent handle block navigation
                onKeyDown(e, id);
            }
        },
        [id, onKeyDown, onContentChange]
    );

    // Handle focus
    const handleFocus = useCallback(() => {
        onFocus(id);
    }, [id, onFocus]);

    // Handle language change
    const handleLanguageChange = useCallback(
        (e) => {
            onPropertiesChange(id, { ...properties, language: e.target.value });
        },
        [id, properties, onPropertiesChange]
    );

    const language = properties?.language || "javascript";

    return (
        <div
            className={cn(
                "relative my-2 rounded-lg overflow-hidden",
                "bg-gray-900",
                "border border-gray-700",
                isActive && "ring-2 ring-blue-500/30"
            )}
            data-block-id={id}
        >
            {/* Language selector */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    className={cn(
                        "text-xs text-gray-400 bg-transparent",
                        "border-none outline-none cursor-pointer",
                        "hover:text-gray-300"
                    )}
                >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="plaintext">Plain Text</option>
                </select>
            </div>

            {/* Code textarea */}
            <textarea
                ref={textareaRef}
                defaultValue={content}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                spellCheck={false}
                className={cn(
                    "w-full min-h-[100px] p-4",
                    "bg-transparent text-gray-100",
                    "font-mono text-sm leading-relaxed",
                    "outline-none resize-none",
                    "placeholder:text-gray-500"
                )}
                placeholder="// Enter code here..."
            />
        </div>
    );
}
