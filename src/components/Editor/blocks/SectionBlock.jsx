import { useState, useRef, useEffect } from "react";
import { cn } from "../../../utils/cn";
import { Trash2 } from "lucide-react";
import { useEditorStore } from "../../../stores/editorStore";

/**
 * SectionBlock - Horizontal divider with optional title
 */
export function SectionBlock({
    block,
    isActive,
    onFocus,
    onKeyDown: parentOnKeyDown,
    onUpdate
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(block.properties?.title || "");
    const inputRef = useRef(null);
    const { deleteBlock } = useEditorStore();

    // Focus input when editing
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleTitleClick = () => {
        setIsEditing(true);
        onFocus?.();
    };

    const handleTitleBlur = () => {
        setIsEditing(false);
        if (title !== block.properties?.title) {
            onUpdate?.({
                ...block,
                properties: { ...block.properties, title }
            });
        }
    };

    // Handle parent keyboard events
    const handleContainerKeyDown = (e) => {
        if (!isEditing) {
            parentOnKeyDown?.(e, block.id);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
        }
        if (e.key === "Escape") {
            setTitle(block.properties?.title || "");
            inputRef.current?.blur();
        }
    };

    const hasTitle = title.trim().length > 0 || isEditing;

    return (
        <div
            tabIndex={0}
            data-block-type="SECTION"
            className={cn(
                "relative py-6 group outline-none",
                isActive && "ring-1 ring-gray-300 rounded-lg"
            )}
            onClick={onFocus}
            onKeyDown={handleContainerKeyDown}
        >
            <div className="flex items-center gap-4">
                {/* Left line */}
                <div
                    className={cn(
                        "flex-1 h-px",
                        "bg-linear-to-r from-transparent via-gray-300 to-gray-300",
                        "group-hover:via-gray-400 group-hover:to-gray-400",
                        "transition-colors duration-200"
                    )}
                />

                {/* Title area */}
                {hasTitle ? (
                    isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder="Section title..."
                            className={cn(
                                "px-3 py-1 min-w-[100px] max-w-[300px]",
                                "text-sm font-semibold text-gray-700",
                                "bg-white border border-blue-300 rounded-md",
                                "outline-none ring-2 ring-blue-100",
                                "transition-all duration-150"
                            )}
                        />
                    ) : (
                        <button
                            onClick={handleTitleClick}
                            className={cn(
                                "px-3 py-1",
                                "text-sm font-semibold text-gray-500",
                                "hover:text-gray-700 hover:bg-gray-100",
                                "rounded-md transition-all duration-150",
                                "hover:scale-[1.02]"
                            )}
                        >
                            {title || "Add title..."}
                        </button>
                    )
                ) : (
                    <button
                        onClick={handleTitleClick}
                        className={cn(
                            "px-3 py-1",
                            "text-xs text-gray-400",
                            "opacity-0 group-hover:opacity-100",
                            "hover:text-gray-600 hover:bg-gray-100",
                            "rounded-md transition-all duration-150"
                        )}
                    >
                        Add title
                    </button>
                )}

                {/* Right line */}
                <div
                    className={cn(
                        "flex-1 h-px",
                        "bg-linear-to-l from-transparent via-gray-300 to-gray-300",
                        "group-hover:via-gray-400 group-hover:to-gray-400",
                        "transition-colors duration-200"
                    )}
                />
            </div>

            {/* Delete Block Button */}
            <button
                className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 z-10",
                    "p-1.5 rounded-lg bg-white shadow-sm border border-gray-200",
                    "text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200",
                    "opacity-0 group-hover:opacity-100",
                    "transition-all duration-200",
                    "translate-x-2 group-hover:translate-x-0",
                    "pointer-events-none group-hover:pointer-events-auto"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    deleteBlock(block.id);
                }}
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}
