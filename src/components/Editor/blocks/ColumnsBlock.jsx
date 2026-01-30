import { useState, useRef, useEffect } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useEditorStore } from "../../../stores/editorStore";
import { BLOCK_TYPES } from "../../../constants/BLOCK_TYPES";
import { NestedBlock } from "./NestedBlock";

/**
 * ColumnsBlock - Multi-column layout container
 */
export function ColumnsBlock({
    block,
    isActive,
    onFocus,
    onKeyDown,
    onUpdate
}) {
    const [isResizing, setIsResizing] = useState(false);
    const [resizingIndex, setResizingIndex] = useState(null);
    const containerRef = useRef(null);
    const startXRef = useRef(0);
    const startWidthsRef = useRef([]);

    const { addBlockToColumn, deleteBlock } = useEditorStore();

    const columnCount = block.properties?.count || 2;
    const widths =
        block.properties?.widths || Array(columnCount).fill(100 / columnCount);
    const gap = block.properties?.gap || 16;
    const columnBlocks = block.children || [];

    // Get blocks for a specific column
    const getColumnBlocks = (columnIndex) => {
        const column = columnBlocks.find((c) => c.columnIndex === columnIndex);
        return column?.blocks || [];
    };

    // Handle keyboard events
    const handleKeyDown = (e) => {
        // Pass to parent for Enter/Backspace handling
        onKeyDown?.(e, block.id);
    };

    // Handle resize using refs updated via useEffect
    const resizingIndexRef = useRef(resizingIndex);
    const blockRef = useRef(block);
    const onUpdateRef = useRef(onUpdate);

    useEffect(() => {
        resizingIndexRef.current = resizingIndex;
    }, [resizingIndex]);

    useEffect(() => {
        blockRef.current = block;
    }, [block]);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    // Handle resize events
    useEffect(() => {
        if (!isResizing) return;

        const handleResizeMove = (e) => {
            if (!containerRef.current || resizingIndexRef.current === null)
                return;

            const containerWidth = containerRef.current.offsetWidth;
            const deltaX = e.clientX - startXRef.current;
            const deltaPercent = (deltaX / containerWidth) * 100;

            const newWidths = [...startWidthsRef.current];
            const minWidth = 20;
            const idx = resizingIndexRef.current;

            const leftWidth = startWidthsRef.current[idx] + deltaPercent;
            const rightWidth = startWidthsRef.current[idx + 1] - deltaPercent;

            if (leftWidth >= minWidth && rightWidth >= minWidth) {
                newWidths[idx] = leftWidth;
                newWidths[idx + 1] = rightWidth;

                onUpdateRef.current?.({
                    ...blockRef.current,
                    properties: {
                        ...blockRef.current.properties,
                        widths: newWidths
                    }
                });
            }
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
            setResizingIndex(null);
        };

        document.addEventListener("mousemove", handleResizeMove);
        document.addEventListener("mouseup", handleResizeEnd);

        return () => {
            document.removeEventListener("mousemove", handleResizeMove);
            document.removeEventListener("mouseup", handleResizeEnd);
        };
    }, [isResizing]);

    // Handle resize start
    const handleResizeStart = (e, index) => {
        e.preventDefault();
        setIsResizing(true);
        setResizingIndex(index);
        startXRef.current = e.clientX;
        startWidthsRef.current = [...widths];
    };

    // Double-click to reset columns to equal widths
    const handleDividerDoubleClick = () => {
        const equalWidth = 100 / columnCount;
        onUpdate?.({
            ...block,
            properties: {
                ...block.properties,
                widths: Array(columnCount).fill(equalWidth)
            }
        });
    };

    // Add a new empty paragraph block to column
    const handleAddBlockToColumn = (columnIndex) => {
        addBlockToColumn?.(block.id, columnIndex, {
            type: BLOCK_TYPES.PARAGRAPH,
            content: ""
        });
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            data-block-type="COLUMNS"
            className={cn(
                "relative py-4 group w-full outline-none",
                isActive && "ring-1 ring-gray-300 rounded-lg",
                isResizing && "select-none"
            )}
            onClick={onFocus}
            onKeyDown={handleKeyDown}
        >
            <div className="flex w-full" style={{ gap: `${gap}px` }}>
                {Array.from({ length: columnCount }).map((_, columnIndex) => (
                    <div
                        key={columnIndex}
                        className="flex items-start"
                        style={{ flex: `${widths[columnIndex]} 0 0%` }}
                    >
                        {/* Column */}
                        <div
                            className={cn(
                                "w-full min-h-[120px] px-3 py-2",
                                // Removed borders for cleaner look
                                "rounded-lg",
                                "transition-colors duration-150"
                            )}
                            onClick={(e) => {
                                // If clicking empty area and no blocks, add one
                                if (getColumnBlocks(columnIndex).length === 0) {
                                    e.stopPropagation();
                                    handleAddBlockToColumn(columnIndex);
                                }
                            }}
                        >
                            {/* Column content */}
                            {getColumnBlocks(columnIndex).length > 0 ? (
                                <div className="space-y-1">
                                    {getColumnBlocks(columnIndex).map(
                                        (blockId) => (
                                            <NestedBlock
                                                key={blockId}
                                                blockId={blockId}
                                                parentBlockId={block.id}
                                            />
                                        )
                                    )}
                                </div>
                            ) : (
                                /* Empty State - Invisible Click Area */
                                <div
                                    className="w-full h-full min-h-[100px] cursor-text group/empty"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddBlockToColumn(columnIndex);
                                    }}
                                >
                                    <div className="text-gray-300 opacity-0 group-hover/empty:opacity-100 transition-opacity duration-200 pl-1 pt-1 text-sm select-none pointer-events-none">
                                        Type widely...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resize divider (between columns) */}
                        {columnIndex < columnCount - 1 && (
                            <div
                                className={cn(
                                    "relative flex items-center justify-center",
                                    "w-6 -mx-1 z-10 h-full min-h-[120px]",
                                    "cursor-col-resize"
                                )}
                                onMouseDown={(e) =>
                                    handleResizeStart(e, columnIndex)
                                }
                                onDoubleClick={handleDividerDoubleClick}
                            >
                                {/* Divider line */}
                                <div
                                    className={cn(
                                        "w-0.5 h-full min-h-[120px]",
                                        "bg-gray-200",
                                        "group-hover:bg-gray-300",
                                        isResizing &&
                                            resizingIndex === columnIndex &&
                                            "bg-gray-500",
                                        "transition-colors duration-150"
                                    )}
                                />

                                {/* Drag handle */}
                                <div
                                    className={cn(
                                        "absolute top-1/2 -translate-y-1/2",
                                        "p-1 rounded",
                                        "bg-white border border-gray-200",
                                        "shadow-sm",
                                        "opacity-0 group-hover:opacity-100",
                                        isResizing &&
                                            "opacity-100 bg-gray-100 border-gray-400",
                                        "transition-opacity duration-150"
                                    )}
                                >
                                    <GripVertical
                                        className={cn(
                                            "w-3 h-3",
                                            isResizing
                                                ? "text-gray-600"
                                                : "text-gray-400"
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Delete Block Button (Bottom Right) */}
            <button
                className={cn(
                    "absolute -bottom-3 -right-3 z-10",
                    "p-1.5 rounded-lg bg-white shadow-sm border border-gray-200",
                    "text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200",
                    "opacity-0 group-hover:opacity-100",
                    "transition-all duration-200",
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
