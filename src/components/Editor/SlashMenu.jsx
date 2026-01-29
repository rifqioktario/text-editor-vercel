import { useState, useEffect, useRef } from "react";
import {
    Heading1,
    AlignLeft,
    CheckSquare,
    Quote,
    Code,
    Minus,
    Image,
    Link,
    Video,
    Folder,
    Indent
} from "lucide-react";
import { BLOCK_TYPES } from "../../constants/BLOCK_TYPES";
import { cn } from "../../utils/cn";

/**
 * Menu items for the slash menu - matching reference design
 */
const MENU_ITEMS = [
    {
        id: "title",
        label: "Title",
        icon: Heading1,
        type: BLOCK_TYPES.HEADING_1
    },
    {
        id: "text",
        label: "Text",
        icon: AlignLeft,
        type: BLOCK_TYPES.PARAGRAPH
    },
    {
        id: "task",
        label: "Task",
        icon: CheckSquare,
        type: BLOCK_TYPES.TASK
    },
    {
        id: "quote",
        label: "Quote",
        icon: Quote,
        type: BLOCK_TYPES.QUOTE
    },
    {
        id: "code",
        label: "Code",
        icon: Code,
        type: BLOCK_TYPES.CODE
    },
    {
        id: "image",
        label: "Image",
        icon: Image,
        type: BLOCK_TYPES.IMAGE,
        disabled: true
    },
    {
        id: "link",
        label: "Link",
        icon: Link,
        type: BLOCK_TYPES.LINK,
        disabled: true
    },
    {
        id: "video",
        label: "Video",
        icon: Video,
        type: null, // Future
        disabled: true
    },
    {
        id: "group",
        label: "Group",
        icon: Folder,
        type: null, // Future
        disabled: true
    },
    {
        id: "tab",
        label: "Tab",
        icon: Indent,
        type: null, // Future
        disabled: true
    },
    {
        id: "divider",
        label: "Horizontal",
        icon: Minus,
        type: BLOCK_TYPES.DIVIDER
    }
];

/**
 * SlashMenu - Block type picker triggered by /
 */
export function SlashMenu({ isOpen, position, filter, onSelect, onClose }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);
    const prevFilterRef = useRef(filter);

    // Filter menu items based on query (only enabled items)
    const filteredItems = MENU_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(filter.toLowerCase())
    );

    // Get enabled items only for keyboard navigation
    const enabledItems = filteredItems.filter((item) => !item.disabled);

    // Reset selection when filter changes (using effect)
    useEffect(() => {
        if (prevFilterRef.current !== filter) {
            prevFilterRef.current = filter;
            setSelectedIndex(0);
        }
    }, [filter]);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < enabledItems.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : enabledItems.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (
                        enabledItems[selectedIndex] &&
                        enabledItems[selectedIndex].type
                    ) {
                        onSelect(enabledItems[selectedIndex].type);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, selectedIndex, enabledItems, onSelect, onClose]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen || filteredItems.length === 0) return null;

    // Find enabled index for highlighting
    let enabledIndex = 0;

    return (
        <div
            ref={menuRef}
            className={cn(
                "fixed z-50",
                "w-48",
                "bg-white/80 backdrop-blur-xl rounded-xl",
                "shadow-lg border border-white/40",
                "overflow-hidden"
            )}
            style={{
                top: position.top,
                left: position.left
            }}
        >
            <div className="py-2">
                {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isEnabled = !item.disabled;
                    const isSelected =
                        isEnabled && enabledIndex === selectedIndex;

                    if (isEnabled) {
                        enabledIndex++;
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (isEnabled && item.type) {
                                    onSelect(item.type);
                                }
                            }}
                            onMouseEnter={() => {
                                if (isEnabled) {
                                    // Find the enabled index for this item
                                    let idx = 0;
                                    for (
                                        let i = 0;
                                        i < filteredItems.length;
                                        i++
                                    ) {
                                        if (filteredItems[i].id === item.id)
                                            break;
                                        if (!filteredItems[i].disabled) idx++;
                                    }
                                    setSelectedIndex(idx);
                                }
                            }}
                            disabled={item.disabled}
                            className={cn(
                                "w-full flex items-center gap-3",
                                "px-3 py-2 text-left",
                                "text-sm",
                                "rounded-lg transition-colors",
                                isEnabled
                                    ? "text-gray-700 cursor-pointer"
                                    : "text-gray-400 cursor-not-allowed",
                                isSelected && "bg-gray-100"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-4 h-4",
                                    isEnabled
                                        ? "text-gray-600"
                                        : "text-gray-400"
                                )}
                            />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
