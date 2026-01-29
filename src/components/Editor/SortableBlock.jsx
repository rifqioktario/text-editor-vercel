import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "./Block";
import { BlockHandle } from "./BlockHandle";
import { cn } from "../../utils/cn";

/**
 * SortableBlock - Wrapper that makes a block draggable with @dnd-kit
 */
export function SortableBlock({
    block,
    isActive,
    isSelected,
    isFirstBlock,
    isSingleBlock,
    onContentChange,
    onPropertiesChange,
    onKeyDown,
    onFocus
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group",
                isDragging && "z-50 opacity-50",
                isSelected && "ring-2 ring-blue-500 rounded-lg bg-blue-50/30"
            )}
        >
            {/* Drag Handle */}
            <BlockHandle
                listeners={listeners}
                attributes={attributes}
                isDragging={isDragging}
            />

            {/* Block Content */}
            <div
                className={cn(
                    isDragging &&
                        "shadow-xl ring-2 ring-blue-500/30 rounded-lg bg-white"
                )}
            >
                <Block
                    block={block}
                    isActive={isActive}
                    isFirstBlock={isFirstBlock}
                    isSingleBlock={isSingleBlock}
                    onContentChange={onContentChange}
                    onPropertiesChange={onPropertiesChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                />
            </div>
        </div>
    );
}
