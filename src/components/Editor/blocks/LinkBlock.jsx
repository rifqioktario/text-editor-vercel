import { useState, useRef, useEffect } from "react";
import {
    Link as LinkIcon,
    X,
    Pencil,
    ExternalLink,
    Copy,
    Check,
    Loader2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { cn } from "../../../utils/cn";

/**
 * Fetch link metadata using Microlink API (free, no registration required)
 */
const fetchLinkMetadata = async (url) => {
    try {
        const { data } = await axios.get(
            `https://api.microlink.io?url=${encodeURIComponent(url)}`,
            { timeout: 5000 }
        );

        if (data.status === "success") {
            return {
                title: data.data.title || new URL(url).hostname,
                description: data.data.description || "",
                favicon:
                    data.data.logo?.url ||
                    `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
                image: data.data.image?.url || null
            };
        }
        throw new Error("Failed to fetch metadata");
    } catch {
        // Fallback to basic info
        const hostname = new URL(url).hostname;
        return {
            title: hostname,
            description: url,
            favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
            image: null
        };
    }
};

/**
 * LinkBlock - Link preview card with favicon, title, description
 */
export function LinkBlock({
    block,
    isActive,
    onFocus,
    onKeyDown: parentOnKeyDown,
    onUpdate
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [linkUrl, setLinkUrl] = useState(block.content || "");
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const urlInputRef = useRef(null);
    const containerRef = useRef(null);

    const hasLink = block.content && block.content.trim() !== "";
    const title = block.properties?.title || "";
    const description = block.properties?.description || "";
    const favicon = block.properties?.favicon || "";

    // Focus URL input when editing
    useEffect(() => {
        if (isEditing && urlInputRef.current) {
            urlInputRef.current.focus();
            urlInputRef.current.select();
        }
    }, [isEditing]);

    // Sync URL state with block
    useEffect(() => {
        setLinkUrl(block.content || "");
    }, [block.content]);

    // Auto-fetch metadata if content exists but metadata is missing
    useEffect(() => {
        const autoFetch = async () => {
            // Skip if no content, already has title, or currently loading
            if (!block.content || block.properties?.title || isLoading) return;

            // Validate URL before fetching
            try {
                new URL(block.content);
            } catch {
                return;
            }

            setIsLoading(true);
            try {
                const metadata = await fetchLinkMetadata(block.content);
                onUpdate?.({
                    ...block,
                    properties: {
                        ...block.properties,
                        ...metadata
                    }
                });
            } catch (error) {
                console.error("Failed to auto-fetch metadata", error);
            } finally {
                setIsLoading(false);
            }
        };

        autoFetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [block.content, block.properties?.title, onUpdate]);

    const handleSaveLink = async () => {
        if (!linkUrl.trim()) return;

        // Validate URL
        let validUrl = linkUrl.trim();
        if (
            !validUrl.startsWith("http://") &&
            !validUrl.startsWith("https://")
        ) {
            validUrl = "https://" + validUrl;
        }

        try {
            new URL(validUrl);
        } catch {
            // Invalid URL, just save as-is
            onUpdate?.({
                ...block,
                content: validUrl,
                properties: {
                    ...block.properties,
                    title: validUrl,
                    description: "",
                    favicon: ""
                }
            });
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const metadata = await fetchLinkMetadata(validUrl);
            onUpdate?.({
                ...block,
                content: validUrl,
                properties: {
                    ...block.properties,
                    title: metadata.title,
                    description: metadata.description,
                    favicon: metadata.favicon,
                    image: metadata.image
                }
            });
        } catch {
            onUpdate?.({
                ...block,
                content: validUrl,
                properties: {
                    ...block.properties,
                    title: new URL(validUrl).hostname,
                    description: "",
                    favicon: `https://www.google.com/s2/favicons?domain=${new URL(validUrl).hostname}&sz=64`
                }
            });
        } finally {
            setIsLoading(false);
            setIsEditing(false);
        }
    };

    const handleRemoveLink = () => {
        onUpdate?.({
            ...block,
            content: "",
            properties: {
                ...block.properties,
                title: "",
                description: "",
                favicon: "",
                image: null
            }
        });
        setLinkUrl("");
    };

    const handleOpenLink = (e) => {
        e.stopPropagation();
        if (block.content) {
            window.open(block.content, "_blank", "noopener,noreferrer");
        }
    };

    const handleCopyLink = async (e) => {
        e.stopPropagation();
        if (block.content) {
            await navigator.clipboard.writeText(block.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleContainerKeyDown = (e) => {
        parentOnKeyDown?.(e, block.id);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveLink();
        }
        if (e.key === "Escape") {
            setIsEditing(false);
            setLinkUrl(block.content || "");
        }
    };

    // Get domain from URL for display
    const getDomain = (url) => {
        try {
            return new URL(url).hostname.replace("www.", "");
        } catch {
            return url;
        }
    };

    // Empty state - show placeholder
    if (!hasLink && !isEditing) {
        return (
            <div
                ref={containerRef}
                tabIndex={0}
                data-block-type="LINK"
                className={cn(
                    "relative py-4 group outline-none",
                    isActive && "ring-1 ring-gray-300 rounded-lg"
                )}
                onClick={onFocus}
                onKeyDown={handleContainerKeyDown}
            >
                <button
                    onClick={() => setIsEditing(true)}
                    className={cn(
                        "w-full py-10",
                        "border-2 border-dashed border-gray-300",
                        "rounded-xl",
                        "flex flex-col items-center justify-center gap-3",
                        "text-gray-400 hover:text-gray-600",
                        "hover:border-gray-400 hover:bg-gray-50/50",
                        "transition-all duration-200"
                    )}
                >
                    <LinkIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">Add a link</span>
                    <span className="text-xs text-gray-400">
                        Paste a URL to create a link preview
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            data-block-type="LINK"
            className={cn(
                "relative py-4 group outline-none",
                isActive && "ring-1 ring-gray-300 rounded-lg"
            )}
            onClick={onFocus}
            onKeyDown={handleContainerKeyDown}
        >
            {/* Link preview card */}
            {hasLink && !isEditing && (
                <div
                    onClick={handleOpenLink}
                    className={cn(
                        "relative cursor-pointer",
                        "border border-gray-200 rounded-xl",
                        "bg-white hover:bg-gray-50",
                        "shadow-sm hover:shadow-md",
                        "transition-all duration-200",
                        "overflow-hidden"
                    )}
                >
                    <div className="flex">
                        {/* Preview image (if available) */}
                        {block.properties?.image && (
                            <div className="hidden sm:block w-48 h-32 shrink-0">
                                <img
                                    src={block.properties.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = "none";
                                    }}
                                />
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 p-4 min-w-0">
                            {/* Domain with favicon */}
                            <div className="flex items-center gap-2 mb-2">
                                {favicon && (
                                    <img
                                        src={favicon}
                                        alt=""
                                        className="w-4 h-4 rounded"
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                )}
                                <span className="text-xs text-gray-500 truncate">
                                    {getDomain(block.content)}
                                </span>
                                <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                            </div>

                            {/* Title */}
                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 mb-1">
                                {title || getDomain(block.content)}
                            </h3>

                            {/* Description */}
                            {description && (
                                <p className="text-xs text-gray-500 line-clamp-2">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Hover overlay with controls */}
                    <div
                        className={cn(
                            "absolute top-2 right-2",
                            "flex gap-1",
                            "opacity-0 group-hover:opacity-100",
                            "transition-opacity duration-150"
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Copy button */}
                        <button
                            onClick={handleCopyLink}
                            className={cn(
                                "w-8 h-8 rounded-lg",
                                "bg-white/90 backdrop-blur-sm hover:bg-white",
                                "flex items-center justify-center",
                                "text-gray-600 hover:text-gray-900",
                                "shadow-lg border border-gray-200",
                                "transition-all duration-150"
                            )}
                            title="Copy link"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>

                        {/* Edit button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                            className={cn(
                                "w-8 h-8 rounded-lg",
                                "bg-white/90 backdrop-blur-sm hover:bg-white",
                                "flex items-center justify-center",
                                "text-gray-600 hover:text-gray-900",
                                "shadow-lg border border-gray-200",
                                "transition-all duration-150"
                            )}
                            title="Edit link"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>

                        {/* Remove button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLink();
                            }}
                            className={cn(
                                "w-8 h-8 rounded-lg",
                                "bg-white/90 backdrop-blur-sm hover:bg-red-500",
                                "flex items-center justify-center",
                                "text-gray-600 hover:text-white",
                                "shadow-lg border border-gray-200",
                                "transition-all duration-150"
                            )}
                            title="Remove link"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* URL input modal */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "p-4",
                            "bg-white border border-gray-200",
                            "rounded-xl shadow-lg"
                        )}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    ref={urlInputRef}
                                    type="text"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Paste a link (e.g., https://example.com)"
                                    disabled={isLoading}
                                    className={cn(
                                        "w-full px-3 py-2 pr-10",
                                        "border border-gray-300 rounded-lg",
                                        "text-sm placeholder-gray-400",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                />
                                {isLoading && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setLinkUrl(block.content || "");
                                    }}
                                    disabled={isLoading}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg",
                                        "text-sm text-gray-600",
                                        "hover:bg-gray-100",
                                        "transition-colors",
                                        "disabled:opacity-50"
                                    )}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveLink}
                                    disabled={!linkUrl.trim() || isLoading}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg",
                                        "text-sm text-white",
                                        "bg-blue-500 hover:bg-blue-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "transition-colors",
                                        "flex items-center gap-2"
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Fetching...
                                        </>
                                    ) : block.content ? (
                                        "Update Link"
                                    ) : (
                                        "Add Link"
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
