import { cn } from "../../../utils/cn";

/**
 * DividerBlock - Horizontal line separator
 */
export function DividerBlock({ id, isActive, onFocus, onKeyDown }) {
    const handleKeyDown = (e) => {
        // Pass to parent for Enter/Backspace handling
        onKeyDown?.(e, id);
    };

    return (
        <div
            tabIndex={0}
            data-block-type="DIVIDER"
            data-block-id={id}
            className={cn(
                "py-4 cursor-pointer outline-none",
                "group",
                isActive && "bg-blue-50/30 rounded"
            )}
            onClick={() => onFocus(id)}
            onKeyDown={handleKeyDown}
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
