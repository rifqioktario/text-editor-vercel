import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText,
    Settings,
    Share,
    PanelLeft,
    SquarePen,
    Trash2,
    Copy,
    Upload
} from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * TopBar - Apple-style header with centered title
 */
export function TopBar({
    title = "Untitled",
    createdAt,
    updatedAt,
    isSidebarVisible = true,
    onToggleSidebar,
    onRename,
    onNewDocument,
    onDelete,
    onDuplicate,
    onExport
}) {
    const [isGearOpen, setIsGearOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(title);
    const inputRef = useRef(null);
    const gearRef = useRef(null);

    // Update local title when prop changes
    useEffect(() => {
        setEditTitle(title);
    }, [title]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Close gear menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (gearRef.current && !gearRef.current.contains(e.target)) {
                setIsGearOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle title save
    const handleTitleSave = () => {
        setIsEditing(false);
        if (editTitle.trim() && editTitle !== title) {
            onRename?.(editTitle.trim());
        } else {
            setEditTitle(title);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return (
            date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            }) +
            " at " +
            date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit"
            })
        );
    };

    return (
        <header
            className={cn(
                "h-12 flex items-center justify-between px-3",
                "bg-white/80 backdrop-blur-xl",
                "border-b border-black/5"
            )}
        >
            {/* Left spacer for centering */}
            <div className="w-24" />

            {/* Center - Document Title */}
            <div className="flex-1 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" strokeWidth={1.5} />

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleTitleSave();
                            if (e.key === "Escape") {
                                setEditTitle(title);
                                setIsEditing(false);
                            }
                        }}
                        className={cn(
                            "text-[15px] text-gray-700 font-medium",
                            "bg-transparent border-b border-blue-500",
                            "outline-none text-center",
                            "min-w-[100px] max-w-[300px]"
                        )}
                    />
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className={cn(
                            "text-[15px] text-gray-700 font-medium",
                            "hover:text-gray-900",
                            "transition-colors duration-100",
                            "cursor-text"
                        )}
                    >
                        {title || "Untitled"}
                    </button>
                )}
            </div>

            {/* Right - Gear & Share */}
            <div className="w-24 flex items-center justify-end gap-1">
                {/* Gear Menu */}
                <div ref={gearRef} className="relative">
                    <button
                        onClick={() => setIsGearOpen(!isGearOpen)}
                        className={cn(
                            "w-8 h-8 rounded-lg",
                            "flex items-center justify-center",
                            "text-gray-500 hover:text-gray-700",
                            "hover:bg-black/5",
                            "transition-colors duration-100",
                            isGearOpen && "bg-black/5 text-gray-700"
                        )}
                    >
                        <Settings
                            className="w-[18px] h-[18px]"
                            strokeWidth={1.5}
                        />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                        {isGearOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.12 }}
                                className={cn(
                                    "absolute right-0 top-full mt-2 z-50",
                                    "w-56 py-1.5",
                                    "bg-white/80 backdrop-blur-xl",
                                    "rounded-xl shadow-xl shadow-black/10",
                                    "border border-black/5"
                                )}
                            >
                                {/* Show Sidebar */}
                                <MenuItem
                                    icon={PanelLeft}
                                    label={
                                        isSidebarVisible
                                            ? "Hide sidebar"
                                            : "Show sidebar"
                                    }
                                    onClick={() => {
                                        onToggleSidebar?.();
                                        setIsGearOpen(false);
                                    }}
                                />

                                {/* New Page */}
                                <MenuItem
                                    icon={SquarePen}
                                    label="New page"
                                    onClick={() => {
                                        onNewDocument?.();
                                        setIsGearOpen(false);
                                    }}
                                />

                                {/* Divider */}
                                <div className="my-1.5 mx-3 border-t border-black/5" />

                                {/* Section Header */}
                                <div className="px-3 py-1 text-[11px] text-gray-400 uppercase tracking-wide">
                                    Document
                                </div>

                                {/* Delete */}
                                <MenuItem
                                    icon={Trash2}
                                    label="Delete"
                                    onClick={() => {
                                        onDelete?.();
                                        setIsGearOpen(false);
                                    }}
                                />

                                {/* Duplicate */}
                                <MenuItem
                                    icon={Copy}
                                    label="Duplicate"
                                    onClick={() => {
                                        onDuplicate?.();
                                        setIsGearOpen(false);
                                    }}
                                />

                                {/* Export */}
                                <MenuItem
                                    icon={Upload}
                                    label="Export"
                                    onClick={() => {
                                        onExport?.();
                                        setIsGearOpen(false);
                                    }}
                                />

                                {/* Divider */}
                                <div className="my-1.5 mx-3 border-t border-black/5" />

                                {/* Timestamps */}
                                <div className="px-3 py-2 space-y-2">
                                    <div>
                                        <div className="text-[11px] text-gray-400">
                                            Created
                                        </div>
                                        <div className="text-[13px] text-gray-600">
                                            {formatDate(createdAt)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-gray-400">
                                            Updated
                                        </div>
                                        <div className="text-[13px] text-gray-600">
                                            {formatDate(updatedAt)}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Share Button */}
                <button
                    className={cn(
                        "w-8 h-8 rounded-lg",
                        "flex items-center justify-center",
                        "text-gray-500 hover:text-gray-700",
                        "hover:bg-black/5",
                        "transition-colors duration-100"
                    )}
                    title="Share"
                >
                    <Share className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
            </div>
        </header>
    );
}

/**
 * MenuItem - Dropdown menu item
 */
function MenuItem({ icon: Icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5",
                "text-[13px] text-gray-700",
                "hover:bg-black/5",
                "transition-colors duration-75"
            )}
        >
            <Icon className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
            {label}
        </button>
    );
}
