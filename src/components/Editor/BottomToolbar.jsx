import { useState, useEffect, useCallback, useRef } from "react";
import {
    LayoutPanelLeft,
    ChevronDown,
    Bold,
    Underline,
    Italic,
    Strikethrough,
    Link,
    Pencil
} from "lucide-react";
import { cn } from "../../utils/cn";
import { BLOCK_TYPES } from "../../constants/BLOCK_TYPES";
import { ToolbarMoreMenu } from "./ToolbarMoreMenu";
import { useMobile } from "../../hooks/useMobile";

/**
 * Block type options for the dropdown
 */
const BLOCK_TYPE_OPTIONS = [
    { id: "title", label: "Title", type: BLOCK_TYPES.HEADING_1 },
    { id: "heading2", label: "Heading 2", type: BLOCK_TYPES.HEADING_2 },
    { id: "heading3", label: "Heading 3", type: BLOCK_TYPES.HEADING_3 },
    { id: "body", label: "Body", type: BLOCK_TYPES.PARAGRAPH },
    { id: "quote", label: "Quote", type: BLOCK_TYPES.QUOTE }
];

/**
 * Get display label for a block type
 */
function getBlockTypeLabel(type) {
    const option = BLOCK_TYPE_OPTIONS.find((opt) => opt.type === type);
    return option?.label || "Body";
}

/**
 * ToolbarButton - Reusable button component
 */
function ToolbarButton({
    icon: Icon,
    onClick,
    isActive = false,
    disabled = false,
    title
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2 rounded-lg transition-all duration-150",
                "flex items-center justify-center",
                disabled && "opacity-40 cursor-not-allowed",
                !disabled &&
                    "cursor-pointer hover:bg-gray-100 active:bg-gray-200 active:scale-95",
                isActive && "bg-gray-200 text-gray-900"
            )}
        >
            <Icon
                className={cn(
                    "w-[18px] h-[18px]",
                    isActive ? "text-gray-900" : "text-gray-600"
                )}
            />
        </button>
    );
}

/**
 * ToolbarDivider - Vertical separator
 */
function ToolbarDivider() {
    return <div className="w-px h-6 bg-gray-200 mx-1" />;
}

/**
 * BottomToolbar - Fixed bottom center formatting toolbar
 */
export function BottomToolbar({
    sidebarCollapsed = false,
    activeBlockId = null,
    activeBlockType = BLOCK_TYPES.PARAGRAPH,
    hasSelection = false,
    formatting = {},
    onBlockTypeChange,
    onFormatToggle,
    onLinkInsert,
    onDuplicateBlock,
    onDeleteBlock,
    onInsertDivider
}) {
    const [isBlockTypeOpen, setIsBlockTypeOpen] = useState(false);
    const { isMobile } = useMobile();
    const triggerRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState({});

    // Calculate fixed position for mobile dropdown
    useEffect(() => {
        if (isBlockTypeOpen && isMobile && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setMenuStyle({
                position: "fixed",
                left: rect.left,
                bottom: window.innerHeight - rect.top + 8,
                zIndex: 100,
                width: "160px"
            });
        }
    }, [isBlockTypeOpen, isMobile]);

    // Calculate sidebar width for dynamic centering (only on desktop)
    const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? 0 : 240;

    // Close dropdown on escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsBlockTypeOpen(false);
            }
        };

        if (isBlockTypeOpen) {
            document.addEventListener("keydown", handleKeyDown);
            return () => document.removeEventListener("keydown", handleKeyDown);
        }
    }, [isBlockTypeOpen]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest("[data-block-type-dropdown]")) {
                setIsBlockTypeOpen(false);
            }
        };

        if (isBlockTypeOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isBlockTypeOpen]);

    // Handle block type selection
    const handleBlockTypeSelect = useCallback(
        (type) => {
            onBlockTypeChange?.(type);
            setIsBlockTypeOpen(false);
        },
        [onBlockTypeChange]
    );

    // Handle format toggle
    const handleFormat = useCallback(
        (format) => {
            if (!hasSelection) return;
            onFormatToggle?.(format);
        },
        [hasSelection, onFormatToggle]
    );

    return (
        <div
            className={cn(
                "fixed z-50",
                // Mobile: full-width scrollable
                isMobile
                    ? [
                          "left-0 right-0 bottom-0",
                          "px-2",
                          "bg-white/95 backdrop-blur-xl",
                          "border-t border-gray-200/50"
                      ]
                    : [
                          "bottom-6",
                          "flex items-center gap-1",
                          "px-2 py-1.5",
                          "bg-white/90 backdrop-blur-xl",
                          "border border-gray-200/50",
                          "rounded-full",
                          "shadow-lg shadow-black/5"
                      ]
            )}
            style={
                isMobile
                    ? {
                          paddingBottom:
                              "calc(env(safe-area-inset-bottom, 0px) + 8px)",
                          paddingTop: "8px"
                      }
                    : {
                          left: `calc(${sidebarWidth}px + (100vw - ${sidebarWidth}px) / 2)`,
                          transform: "translateX(-50%)",
                          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }
            }
        >
            {/* Scrollable container for mobile */}
            <div
                className={cn(
                    "flex items-center",
                    isMobile
                        ? [
                              "overflow-x-auto scrollbar-hide",
                              "gap-1 py-1",
                              "-mx-2 px-2",
                              "snap-x snap-mandatory"
                          ]
                        : "gap-1"
                )}
            >
                {/* Block Type Selector */}
                <div className="relative" data-block-type-dropdown>
                    <button
                        ref={triggerRef}
                        onClick={() => setIsBlockTypeOpen(!isBlockTypeOpen)}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1.5 rounded-lg",
                            "transition-all duration-150",
                            "hover:bg-gray-100 active:bg-gray-200",
                            isBlockTypeOpen && "bg-gray-100"
                        )}
                    >
                        <LayoutPanelLeft className="w-[18px] h-[18px] text-gray-600" />
                        {!isMobile && (
                            <span className="text-sm text-gray-700 font-medium whitespace-nowrap">
                                {getBlockTypeLabel(activeBlockType)}
                            </span>
                        )}
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 text-gray-500 transition-transform",
                                isBlockTypeOpen && "rotate-180"
                            )}
                        />
                    </button>

                    {/* Block Type Dropdown */}
                    {isBlockTypeOpen && (
                        <div
                            style={isMobile ? menuStyle : undefined}
                            className={cn(
                                "py-1 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-lg",
                                isMobile
                                    ? "fixed"
                                    : "absolute bottom-full left-0 mb-2 w-40"
                            )}
                        >
                            {BLOCK_TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() =>
                                        handleBlockTypeSelect(option.type)
                                    }
                                    className={cn(
                                        "w-full px-3 py-2 text-left text-sm",
                                        "transition-colors",
                                        "hover:bg-gray-100",
                                        activeBlockType === option.type &&
                                            "bg-gray-100 text-gray-900 font-medium"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <ToolbarDivider />

                {/* Formatting Buttons */}
                <ToolbarButton
                    icon={Bold}
                    onClick={() => handleFormat("bold")}
                    isActive={formatting.bold}
                    disabled={!hasSelection}
                    title="Bold"
                />
                <ToolbarButton
                    icon={Underline}
                    onClick={() => handleFormat("underline")}
                    isActive={formatting.underline}
                    disabled={!hasSelection}
                    title="Underline"
                />
                <ToolbarButton
                    icon={Italic}
                    onClick={() => handleFormat("italic")}
                    isActive={formatting.italic}
                    disabled={!hasSelection}
                    title="Italic"
                />
                <ToolbarButton
                    icon={Strikethrough}
                    onClick={() => handleFormat("strikethrough")}
                    isActive={formatting.strikethrough}
                    disabled={!hasSelection}
                    title="Strikethrough"
                />

                <ToolbarDivider />

                {/* Link & Highlight */}
                <ToolbarButton
                    icon={Link}
                    onClick={() => onLinkInsert?.()}
                    disabled={!hasSelection}
                    title="Insert Link"
                />
                <ToolbarButton
                    icon={Pencil}
                    onClick={() => handleFormat("highlight")}
                    isActive={formatting.highlight}
                    disabled={!hasSelection}
                    title="Highlight"
                />

                <ToolbarDivider />

                {/* More Options */}
                <ToolbarMoreMenu
                    hasSelection={hasSelection}
                    activeBlockId={activeBlockId}
                    onTextColor={(color) => {
                        if (color) {
                            document.execCommand("foreColor", false, color);
                        } else {
                            document.execCommand("removeFormat", false, null);
                        }
                    }}
                    onBackgroundColor={(color) => {
                        if (color) {
                            document.execCommand("backColor", false, color);
                        } else {
                            document.execCommand("removeFormat", false, null);
                        }
                    }}
                    onAlign={(alignment) =>
                        document.execCommand(`justify${alignment}`, false, null)
                    }
                    onDuplicateBlock={onDuplicateBlock}
                    onDeleteBlock={onDeleteBlock}
                    onInsertDivider={onInsertDivider}
                />
            </div>
        </div>
    );
}
