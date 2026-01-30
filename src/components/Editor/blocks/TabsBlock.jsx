import { useState, useRef, useEffect } from "react";
import { Plus, Pencil, Copy, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../utils/cn";
import { useEditorStore } from "../../../stores/editorStore";
import { BLOCK_TYPES } from "../../../constants/BLOCK_TYPES";
import { NestedBlock } from "./NestedBlock";

/**
 * TabsBlock - Tabbed content container
 */
export function TabsBlock({ block, isActive, onFocus, onKeyDown, onUpdate }) {
    const [editingTabId, setEditingTabId] = useState(null);
    const [editingLabel, setEditingLabel] = useState("");
    const [menuOpenTabId, setMenuOpenTabId] = useState(null);
    const editInputRef = useRef(null);
    const menuRef = useRef(null);
    const containerRef = useRef(null);

    const { addBlockToTab, updateBlockFull, deleteBlock } = useEditorStore();

    const tabs = block.properties?.tabs || [];
    const activeTabId = block.properties?.activeTabId || tabs[0]?.id;
    const tabBlocks = block.children || {};

    // Focus edit input
    useEffect(() => {
        if (editingTabId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingTabId]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpenTabId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get blocks for active tab
    const getActiveTabBlocks = () => {
        return tabBlocks[activeTabId] || [];
    };

    // Handle keyboard events
    const handleKeyDown = (e) => {
        // Pass to parent for Enter/Backspace handling
        onKeyDown?.(e, block.id);
    };

    // Switch active tab
    const handleTabClick = (tabId) => {
        if (editingTabId) return;
        updateBlockFull(block.id, {
            properties: { activeTabId: tabId }
        });
    };

    // Start renaming tab
    const handleStartRename = (tab) => {
        setEditingTabId(tab.id);
        setEditingLabel(tab.label);
        setMenuOpenTabId(null);
    };

    // Save tab rename
    const handleSaveRename = () => {
        if (!editingLabel.trim()) {
            setEditingTabId(null);
            return;
        }

        const updatedTabs = tabs.map((tab) =>
            tab.id === editingTabId
                ? { ...tab, label: editingLabel.trim() }
                : tab
        );

        onUpdate?.({
            ...block,
            properties: { ...block.properties, tabs: updatedTabs }
        });
        setEditingTabId(null);
    };

    // Add new tab
    const handleAddTab = () => {
        const newTab = {
            id: crypto.randomUUID(),
            label: `Tab ${tabs.length + 1}`
        };

        updateBlockFull(block.id, {
            properties: {
                tabs: [...tabs, newTab],
                activeTabId: newTab.id
            },
            children: {
                ...tabBlocks,
                [newTab.id]: []
            }
        });

        // Start editing the new tab name
        setTimeout(() => {
            setEditingTabId(newTab.id);
            setEditingLabel(newTab.label);
        }, 50);
    };

    // Delete tab
    const handleDeleteTab = (tabId) => {
        if (tabs.length <= 1) return; // Keep at least one tab

        const updatedTabs = tabs.filter((tab) => tab.id !== tabId);
        const newChildren = { ...tabBlocks };
        delete newChildren[tabId];

        // Select another tab if deleting active
        const newActiveId =
            activeTabId === tabId ? updatedTabs[0]?.id : activeTabId;

        updateBlockFull(block.id, {
            properties: {
                tabs: updatedTabs,
                activeTabId: newActiveId
            },
            children: newChildren
        });
        setMenuOpenTabId(null);
    };

    // Duplicate tab
    const handleDuplicateTab = (tabId) => {
        const sourcetab = tabs.find((t) => t.id === tabId);
        if (!sourcetab) return;

        const newTab = {
            id: crypto.randomUUID(),
            label: `${sourcetab.label} (copy)`
        };

        const tabIndex = tabs.findIndex((t) => t.id === tabId);

        updateBlockFull(block.id, {
            properties: {
                tabs: [
                    ...tabs.slice(0, tabIndex + 1),
                    newTab,
                    ...tabs.slice(tabIndex + 1)
                ],
                activeTabId: newTab.id
            },
            children: {
                ...tabBlocks,
                [newTab.id]: [...(tabBlocks[tabId] || [])]
            }
        });
        setMenuOpenTabId(null);
    };

    // Add block to active tab
    const handleAddBlockToTab = () => {
        if (!activeTabId) return;
        addBlockToTab?.(block.id, activeTabId, {
            type: BLOCK_TYPES.PARAGRAPH,
            content: ""
        });
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            data-block-type="TABS"
            className={cn(
                "relative py-4 group outline-none",
                isActive && "ring-1 ring-gray-300 rounded-lg"
            )}
            onClick={onFocus}
            onKeyDown={handleKeyDown}
        >
            {/* Tab bar */}
            <div className="relative border-b border-gray-200">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <div key={tab.id} className="relative">
                            {/* Tab button */}
                            {editingTabId === tab.id ? (
                                <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editingLabel}
                                    onChange={(e) =>
                                        setEditingLabel(e.target.value)
                                    }
                                    onBlur={handleSaveRename}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === "Enter")
                                            handleSaveRename();
                                        if (e.key === "Escape")
                                            setEditingTabId(null);
                                    }}
                                    className={cn(
                                        "px-3 py-2 min-w-[60px]",
                                        "text-sm font-medium",
                                        "border border-gray-300 rounded-t-lg",
                                        "outline-none bg-white"
                                    )}
                                />
                            ) : (
                                <button
                                    onClick={() => handleTabClick(tab.id)}
                                    onDoubleClick={() => handleStartRename(tab)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setMenuOpenTabId(tab.id);
                                    }}
                                    className={cn(
                                        "px-4 py-2 relative",
                                        "text-sm font-medium",
                                        "rounded-t-lg",
                                        "transition-all duration-150",
                                        activeTabId === tab.id
                                            ? "text-gray-900 bg-gray-100"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                    )}
                                >
                                    {tab.label}
                                    {/* Active indicator - inline with each tab */}
                                    {activeTabId === tab.id && (
                                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-800 rounded-full" />
                                    )}
                                </button>
                            )}

                            {/* Tab context menu */}
                            <AnimatePresence>
                                {menuOpenTabId === tab.id && (
                                    <motion.div
                                        ref={menuRef}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.95,
                                            y: -5
                                        }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.95,
                                            y: -5
                                        }}
                                        className={cn(
                                            "absolute top-full left-0 z-50 mt-1",
                                            "w-40 py-1",
                                            "bg-white rounded-lg shadow-lg",
                                            "border border-gray-200"
                                        )}
                                    >
                                        <MenuButton
                                            icon={Pencil}
                                            label="Rename"
                                            onClick={() =>
                                                handleStartRename(tab)
                                            }
                                        />
                                        <MenuButton
                                            icon={Copy}
                                            label="Duplicate"
                                            onClick={() =>
                                                handleDuplicateTab(tab.id)
                                            }
                                        />
                                        {tabs.length > 1 && (
                                            <MenuButton
                                                icon={Trash2}
                                                label="Delete"
                                                danger
                                                onClick={() =>
                                                    handleDeleteTab(tab.id)
                                                }
                                            />
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}

                    {/* Add tab button */}
                    <button
                        onClick={handleAddTab}
                        className={cn(
                            "p-2 ml-1",
                            "text-gray-400 hover:text-gray-600",
                            "hover:bg-gray-100 rounded-lg",
                            "transition-all duration-150"
                        )}
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tab content */}
            <div className="pt-4 min-h-[100px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTabId}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                    >
                        {getActiveTabBlocks().length > 0 ? (
                            <div className="space-y-1">
                                {getActiveTabBlocks().map((blockId) => (
                                    <NestedBlock
                                        key={blockId}
                                        blockId={blockId}
                                        parentBlockId={block.id}
                                    />
                                ))}
                            </div>
                        ) : (
                            <button
                                onClick={handleAddBlockToTab}
                                className={cn(
                                    "w-full py-8",
                                    "flex flex-col items-center justify-center gap-2",
                                    "text-gray-400 hover:text-gray-600",
                                    "border-2 border-dashed border-gray-200",
                                    "hover:border-gray-300 hover:bg-gray-50",
                                    "rounded-lg",
                                    "transition-all duration-150"
                                )}
                            >
                                <Plus className="w-5 h-5" />
                                <span className="text-sm">
                                    Add content to this tab
                                </span>
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            {/* Delete Block Button (Bottom Right) */}
            <button
                className={cn(
                    "absolute -bottom-3 -right-3 z-10",
                    "p-2 rounded-lg bg-white shadow-sm border border-gray-200",
                    "text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200",
                    "opacity-0 group-hover:opacity-100",
                    isActive && "opacity-100 pointer-events-auto",
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

/**
 * MenuButton - Tab context menu item
 */
function MenuButton({ icon: Icon, label, danger = false, onClick }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5",
                "text-sm text-left",
                danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-100",
                "transition-colors"
            )}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}
