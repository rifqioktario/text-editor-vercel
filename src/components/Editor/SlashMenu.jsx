import { useState, useEffect, useRef } from "react";
import {
    Heading1,
    AlignLeft,
    CheckSquare,
    Quote,
    Minus,
    Image,
    Link,
    SeparatorHorizontal,
    Images,
    Columns2,
    PanelTop
} from "lucide-react";
import { BLOCK_TYPES } from "../../constants/BLOCK_TYPES";
import { cn } from "../../utils/cn";

/**
 * Menu items for the slash menu - organized by category
 * Separators are represented by objects with type: 'separator'
 */
const MENU_ITEMS = [
    // Text category
    {
        type: "category",
        label: "Text"
    },
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
    // Layout category
    {
        type: "category",
        label: "Layout"
    },
    {
        id: "section",
        label: "Section",
        icon: SeparatorHorizontal,
        type: BLOCK_TYPES.SECTION
    },
    {
        id: "columns",
        label: "2 Columns",
        icon: Columns2,
        type: BLOCK_TYPES.COLUMNS
    },
    {
        id: "tabs",
        label: "Tabs",
        icon: PanelTop,
        type: BLOCK_TYPES.TABS
    },
    // Media category
    {
        type: "category",
        label: "Media"
    },
    {
        id: "image",
        label: "Image",
        icon: Image,
        type: BLOCK_TYPES.IMAGE
    },
    {
        id: "gallery",
        label: "Gallery",
        icon: Images,
        type: BLOCK_TYPES.GALLERY
    },
    {
        id: "divider",
        label: "Divider",
        icon: Minus,
        type: BLOCK_TYPES.DIVIDER
    },
    {
        id: "link",
        label: "Link",
        icon: Link,
        type: BLOCK_TYPES.LINK
    }
];

/**
 * SlashMenu - Block type picker triggered by /
 */
export function SlashMenu({ isOpen, position, filter, onSelect, onClose }) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);
    const buttonsRef = useRef({});

    // Track previous filter to reset selection on change
    const [prevFilter, setPrevFilter] = useState(filter);

    // Adjust state during render (recommended pattern to avoid cascading effects)
    if (filter !== prevFilter) {
        setPrevFilter(filter);
        setSelectedIndex(0);
    }

    // Filter menu items based on query (skip category headers when filtering)
    const filteredItems = filter
        ? MENU_ITEMS.filter(
              (item) =>
                  item.type !== "category" &&
                  item.label.toLowerCase().includes(filter.toLowerCase())
          )
        : MENU_ITEMS; // Show all including categories when no filter

    // Get selectable items only for keyboard navigation (exclude categories)
    const selectableItems = filteredItems.filter(
        (item) => item.type !== "category" && !item.disabled
    );

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < selectableItems.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : selectableItems.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (
                        selectableItems[selectedIndex] &&
                        selectableItems[selectedIndex].type
                    ) {
                        onSelect(selectableItems[selectedIndex].type);
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
    }, [isOpen, selectedIndex, selectableItems, onSelect, onClose]);

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

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && buttonsRef.current[selectedIndex]) {
            buttonsRef.current[selectedIndex].scrollIntoView({
                block: "nearest",
                behavior: "smooth"
            });
        }
    }, [selectedIndex]);

    if (!isOpen || filteredItems.length === 0) return null;

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
            <div className="py-2 overflow-y-auto max-h-[300px]">
                {filteredItems.map((item, index) => {
                    if (item.type === "category") {
                        return (
                            <div
                                key={`category-${index}`}
                                className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider select-none mt-2 first:mt-0"
                            >
                                {item.label}
                            </div>
                        );
                    }

                    const Icon = item.icon;
                    const isEnabled = !item.disabled;

                    // Calculate index in selectableItems list
                    const itemSelectableIndex = selectableItems.findIndex(
                        (i) => i.id === item.id
                    );

                    const isSelected =
                        isEnabled && itemSelectableIndex === selectedIndex;

                    return (
                        <button
                            key={item.id}
                            ref={(el) =>
                                (buttonsRef.current[itemSelectableIndex] = el)
                            }
                            onClick={() => {
                                if (isEnabled && item.type) {
                                    onSelect(item.type);
                                }
                            }}
                            onMouseEnter={() => {
                                if (isEnabled && itemSelectableIndex !== -1) {
                                    setSelectedIndex(itemSelectableIndex);
                                }
                            }}
                            disabled={item.disabled}
                            className={cn(
                                "w-full flex items-center gap-3",
                                "px-3 py-2 text-left",
                                "text-sm",
                                "transition-colors",
                                isEnabled
                                    ? "text-gray-700 cursor-pointer"
                                    : "text-gray-400 cursor-not-allowed",
                                isSelected && "bg-gray-100"
                            )}
                        >
                            {Icon && (
                                <Icon
                                    className={cn(
                                        "w-4 h-4",
                                        isEnabled
                                            ? "text-gray-600"
                                            : "text-gray-400"
                                    )}
                                />
                            )}
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
