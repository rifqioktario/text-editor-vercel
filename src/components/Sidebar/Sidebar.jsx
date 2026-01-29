import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Plus,
    Search,
    FileText,
    MoreHorizontal,
    Trash2,
    Copy,
    PenLine
} from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Sidebar - Apple-inspired document navigation
 */
export function Sidebar({
    documents = [],
    activeDocumentId,
    isCollapsed = false,
    onToggleCollapse,
    onSelectDocument,
    onCreateDocument,
    onDeleteDocument,
    onDuplicateDocument,
    onRenameDocument,
    isSaving = false,
    lastSaved = null
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [menuOpenId, setMenuOpenId] = useState(null);

    // Filter documents
    const filteredDocuments = documents.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest("[data-doc-menu]")) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Format last saved
    const formatLastSaved = useCallback(() => {
        if (!lastSaved) return null;
        const diff = Date.now() - new Date(lastSaved).getTime();
        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
    }, [lastSaved]);

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 0 : 260 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className={cn(
                "h-full overflow-hidden",
                "bg-[#f5f5f7]/80 backdrop-blur-xl",
                "border-r border-black/5",
                "flex flex-col"
            )}
        >
            {/* Header - Apple style minimal */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-[13px] font-medium text-gray-500 uppercase tracking-wide">
                    Documents
                </span>

                <div className="flex items-center gap-1">
                    {/* New Document */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onCreateDocument}
                        className={cn(
                            "w-7 h-7 rounded-md",
                            "flex items-center justify-center",
                            "text-gray-500 hover:text-gray-700",
                            "hover:bg-black/5",
                            "transition-colors duration-150"
                        )}
                        title="New document"
                    >
                        <Plus className="w-4 h-4" strokeWidth={1.5} />
                    </motion.button>

                    {/* Collapse */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onToggleCollapse}
                        className={cn(
                            "w-7 h-7 rounded-md",
                            "flex items-center justify-center",
                            "text-gray-400 hover:text-gray-600",
                            "hover:bg-black/5",
                            "transition-colors duration-150"
                        )}
                    >
                        <motion.div
                            animate={{ rotate: isCollapsed ? 180 : 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <ChevronLeft
                                className="w-4 h-4"
                                strokeWidth={1.5}
                            />
                        </motion.div>
                    </motion.button>
                </div>
            </div>

            {/* Search - Spotlight style */}
            <div className="px-3 pb-2">
                <div
                    className={cn(
                        "relative flex items-center",
                        "bg-black/[0.04] rounded-lg",
                        "focus-within:bg-black/[0.06]",
                        "transition-colors duration-150"
                    )}
                >
                    <Search
                        className="absolute left-2.5 w-3.5 h-3.5 text-gray-400"
                        strokeWidth={1.5}
                    />
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "w-full pl-8 pr-3 py-[6px]",
                            "bg-transparent",
                            "text-[13px] text-gray-700 placeholder-gray-400",
                            "focus:outline-none"
                        )}
                    />
                </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto px-2 py-1">
                <AnimatePresence mode="popLayout">
                    {filteredDocuments.map((doc, index) => (
                        <motion.div
                            key={doc.id}
                            layout
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                                delay: index * 0.02
                            }}
                        >
                            <DocumentItem
                                doc={doc}
                                isActive={doc.id === activeDocumentId}
                                isMenuOpen={menuOpenId === doc.id}
                                onSelect={() => onSelectDocument(doc.id)}
                                onMenuToggle={() =>
                                    setMenuOpenId(
                                        menuOpenId === doc.id ? null : doc.id
                                    )
                                }
                                onDelete={() => {
                                    onDeleteDocument(doc.id);
                                    setMenuOpenId(null);
                                }}
                                onDuplicate={() => {
                                    onDuplicateDocument(doc.id);
                                    setMenuOpenId(null);
                                }}
                                onRename={() => {
                                    onRenameDocument(doc.id);
                                    setMenuOpenId(null);
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredDocuments.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-[13px]">
                        {searchQuery ? "No results" : "No documents"}
                    </div>
                )}
            </div>

            {/* Footer - Save status */}
            <div className="px-4 py-3 border-t border-black/5">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    {isSaving ? (
                        <>
                            <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    ease: "easeInOut"
                                }}
                                className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                            />
                            <span>Saving...</span>
                        </>
                    ) : lastSaved ? (
                        <>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                            <span>Saved {formatLastSaved()}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </motion.aside>
    );
}

/**
 * DocumentItem - Single document row (Apple Finder style)
 */
function DocumentItem({
    doc,
    isActive,
    isMenuOpen,
    onSelect,
    onMenuToggle,
    onDelete,
    onDuplicate,
    onRename
}) {
    return (
        <div
            onClick={onSelect}
            className={cn(
                "group relative",
                "flex items-center gap-2.5",
                "px-2.5 py-2 mb-0.5 rounded-lg",
                "cursor-default select-none",
                "transition-colors duration-100",
                isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-black/[0.04]"
            )}
        >
            <FileText
                className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-white/90" : "text-gray-400"
                )}
                strokeWidth={1.5}
            />

            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "text-[13px] truncate leading-tight",
                        isActive ? "font-medium" : "font-normal"
                    )}
                >
                    {doc.title || "Untitled"}
                </p>
                <p
                    className={cn(
                        "text-[11px] truncate",
                        isActive ? "text-white/60" : "text-gray-400"
                    )}
                >
                    {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                    })}
                </p>
            </div>

            {/* Context Menu Button */}
            <div data-doc-menu className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMenuToggle();
                    }}
                    className={cn(
                        "w-6 h-6 rounded-md",
                        "flex items-center justify-center",
                        "opacity-0 group-hover:opacity-100",
                        "transition-opacity duration-100",
                        isActive ? "hover:bg-white/20" : "hover:bg-black/10",
                        isMenuOpen && "opacity-100 bg-black/10"
                    )}
                >
                    <MoreHorizontal
                        className={cn(
                            "w-4 h-4",
                            isActive ? "text-white" : "text-gray-500"
                        )}
                        strokeWidth={1.5}
                    />
                </button>

                {/* Dropdown - Apple menu style */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className={cn(
                                "absolute right-0 top-full mt-1 z-50",
                                "w-40 py-1",
                                "bg-white/95 backdrop-blur-xl",
                                "rounded-xl shadow-lg shadow-black/10",
                                "border border-black/5"
                            )}
                        >
                            <MenuItem
                                icon={PenLine}
                                label="Rename"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename();
                                }}
                            />
                            <MenuItem
                                icon={Copy}
                                label="Duplicate"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicate();
                                }}
                            />
                            <div className="my-1 border-t border-black/5" />
                            <MenuItem
                                icon={Trash2}
                                label="Delete"
                                danger
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/**
 * MenuItem - Apple-style dropdown menu item
 */
function MenuItem({ icon: Icon, label, danger = false, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5",
                "text-[13px] text-left",
                "transition-colors duration-75",
                danger
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-gray-700 hover:bg-black/5"
            )}
        >
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            {label}
        </button>
    );
}
