import { cn } from "../../../utils/cn";

/**
 * DividerBlock - Horizontal line separator
 */
export function DividerBlock({ id, isActive, onFocus }) {
    return (
        <div
            className={cn(
                "py-4 cursor-pointer",
                "group",
                isActive && "bg-blue-50/30 rounded"
            )}
            onClick={() => onFocus(id)}
            data-block-id={id}
        >
            <hr
                className={cn(
                    "border-0 h-px",
                    "bg-gray-200",
                    "group-hover:bg-gray-300",
                    "transition-colors"
                )}
            />
        </div>
    );
}
