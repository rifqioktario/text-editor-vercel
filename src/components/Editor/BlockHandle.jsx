import { GripVertical } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * BlockHandle - 6-dot grip for dragging blocks
 */
export function BlockHandle({ listeners, attributes, isDragging = false }) {
    return (
        <button
            {...listeners}
            {...attributes}
            className={cn(
                "absolute -left-8 top-1/2 -translate-y-1/2",
                "p-1 rounded",
                "opacity-0 group-hover:opacity-100",
                "transition-all duration-150",
                "text-gray-400 hover:text-gray-600",
                "hover:bg-gray-100",
                isDragging ? "cursor-grabbing" : "cursor-grab",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            )}
            aria-label="Drag to reorder"
        >
            <GripVertical className="w-4 h-4" />
        </button>
    );
}
