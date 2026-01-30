import { useState, useRef, useEffect } from "react";
import { X, Link as LinkIcon, Check, Globe } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";

export function LinkInsertionModal({
    isOpen,
    onClose,
    onSubmit,
    initialUrl = ""
}) {
    const [url, setUrl] = useState(initialUrl);
    const inputRef = useRef(null);

    // Reset URL when modal opens
    useEffect(() => {
        if (isOpen) {
            // Avoid synchronous setState in effect
            requestAnimationFrame(() => {
                setUrl(initialUrl);
            });
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, initialUrl]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url.trim());
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape") onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-white/50 overflow-hidden ring-1 ring-black/5"
                    >
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                                    <LinkIcon className="w-4 h-4" />
                                </div>
                                <span className="font-semibold text-gray-800">
                                    Embed Link
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleSubmit} className="p-5">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
                                    URL
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Paste a link..."
                                        className={cn(
                                            "w-full pl-10 pr-4 py-2.5",
                                            "bg-gray-50 border border-gray-200",
                                            "rounded-xl text-gray-900 placeholder:text-gray-400",
                                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                                            "focus:bg-white",
                                            "transition-all duration-200"
                                        )}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!url.trim()}
                                    className={cn(
                                        "px-4 py-2 rounded-lg",
                                        "text-sm font-medium text-white",
                                        "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                                        "shadow-sm shadow-blue-500/20",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "flex items-center gap-2",
                                        "transition-all duration-200"
                                    )}
                                >
                                    <Check className="w-4 h-4" />
                                    Embed Link
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
