import { useState, useRef, useEffect } from "react";
import {
    Image as ImageIcon,
    X,
    Pencil,
    Upload,
    Link,
    Loader2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../utils/cn";

/**
 * ImageBlock - Single image display with URL input, file upload, and caption
 */
export function ImageBlock({
    block,
    isActive,
    onFocus,
    onKeyDown: parentOnKeyDown,
    onUpdate
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("upload"); // "upload" | "url"
    const [imageUrl, setImageUrl] = useState(block.content || "");
    const [altText, setAltText] = useState(block.properties?.alt || "");
    const [caption, setCaption] = useState(block.properties?.caption || "");
    const [imageError, setImageError] = useState(false);
    const [previewUrl, setPreviewUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const urlInputRef = useRef(null);
    const containerRef = useRef(null);
    const captionRef = useRef(null);
    const fileInputRef = useRef(null);

    const hasImage = block.content && !imageError;
    const width = block.properties?.width || "full";

    // Focus URL input when switching to URL tab
    useEffect(() => {
        if (isEditing && activeTab === "url" && urlInputRef.current) {
            urlInputRef.current.focus();
            urlInputRef.current.select();
        }
    }, [isEditing, activeTab]);

    // Reset local state when starting to edit
    const handleStartEditing = () => {
        setImageUrl(block.content || "");
        setAltText(block.properties?.alt || "");
        setPreviewUrl(block.content || "");
        setIsEditing(true);
    };

    // Handle file selection
    const handleFileSelect = (file) => {
        if (!file) return;

        // Validate file type
        const validTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml"
        ];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Please use JPG, PNG, GIF, WebP, or SVG.");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert("File too large. Maximum size is 10MB.");
            return;
        }

        setIsLoading(true);

        // Convert to data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setImageUrl(dataUrl);
            setPreviewUrl(dataUrl);
            setIsLoading(false);
        };
        reader.onerror = () => {
            alert("Failed to read file. Please try again.");
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            handleFileSelect(file);
        }
    };

    // Handle URL input change with preview
    const handleUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);

        // Update preview after a small delay for validation
        if (url.trim()) {
            setPreviewUrl(url.trim());
        } else {
            setPreviewUrl("");
        }
    };

    const handleSaveImage = () => {
        if (!imageUrl.trim()) return;

        setImageError(false);
        onUpdate?.({
            ...block,
            content: imageUrl.trim(),
            properties: {
                ...block.properties,
                alt: altText.trim() || "Image"
            }
        });
        setIsEditing(false);
        setPreviewUrl("");
    };

    const handleRemoveImage = () => {
        onUpdate?.({
            ...block,
            content: "",
            properties: {
                ...block.properties,
                alt: "",
                caption: ""
            }
        });
        setImageUrl("");
        setAltText("");
        setCaption("");
        setImageError(false);
        setPreviewUrl("");
    };

    const handleCaptionChange = (e) => {
        const newCaption = e.target.value;
        setCaption(newCaption);
        onUpdate?.({
            ...block,
            properties: {
                ...block.properties,
                caption: newCaption
            }
        });
    };

    const handleWidthChange = (newWidth) => {
        onUpdate?.({
            ...block,
            properties: {
                ...block.properties,
                width: newWidth
            }
        });
    };

    const handleContainerKeyDown = (e) => {
        parentOnKeyDown?.(e, block.id);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSaveImage();
        }
        if (e.key === "Escape") {
            setIsEditing(false);
            setImageUrl(block.content || "");
            setAltText(block.properties?.alt || "");
            setPreviewUrl("");
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setImageUrl(block.content || "");
        setAltText(block.properties?.alt || "");
        setPreviewUrl("");
    };

    // Width classes mapping
    const widthClasses = {
        narrow: "max-w-md mx-auto",
        wide: "max-w-2xl mx-auto",
        full: "w-full"
    };

    // Empty state - show placeholder
    if (!hasImage && !isEditing) {
        return (
            <div
                ref={containerRef}
                tabIndex={0}
                data-block-type="IMAGE"
                className={cn(
                    "relative py-4 group outline-none",
                    isActive && "ring-1 ring-gray-300 rounded-lg"
                )}
                onClick={onFocus}
                onKeyDown={handleContainerKeyDown}
            >
                <button
                    onClick={() => handleStartEditing()}
                    className={cn(
                        "w-full py-12",
                        "border-2 border-dashed border-gray-300",
                        "rounded-xl",
                        "flex flex-col items-center justify-center gap-3",
                        "text-gray-400 hover:text-gray-600",
                        "hover:border-gray-400 hover:bg-gray-50/50",
                        "transition-all duration-200"
                    )}
                >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">Add an image</span>
                    <span className="text-xs text-gray-400">
                        Upload from device or paste a URL
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            data-block-type="IMAGE"
            className={cn(
                "relative py-4 group outline-none",
                isActive && "ring-1 ring-gray-300 rounded-lg"
            )}
            onClick={onFocus}
            onKeyDown={handleContainerKeyDown}
        >
            {/* Image display */}
            {hasImage && !isEditing && (
                <div className={cn("relative", widthClasses[width])}>
                    {/* Image container */}
                    <div
                        className={cn(
                            "relative rounded-xl overflow-hidden",
                            "bg-gray-100",
                            "shadow-md hover:shadow-xl",
                            "transition-all duration-200"
                        )}
                    >
                        <img
                            src={block.content}
                            alt={block.properties?.alt || "Image"}
                            className="w-full h-auto object-cover"
                            onError={() => setImageError(true)}
                        />

                        {/* Hover overlay with controls */}
                        <div
                            className={cn(
                                "absolute inset-0",
                                "bg-black/0 hover:bg-black/10",
                                "transition-all duration-200",
                                "flex items-start justify-end gap-2 p-3",
                                "opacity-0 group-hover:opacity-100"
                            )}
                        >
                            {/* Width toggle buttons */}
                            <div className="flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
                                {["narrow", "wide", "full"].map((w) => (
                                    <button
                                        key={w}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleWidthChange(w);
                                        }}
                                        className={cn(
                                            "px-2 py-1 text-xs rounded",
                                            "transition-colors",
                                            width === w
                                                ? "bg-gray-900 text-white"
                                                : "hover:bg-gray-100 text-gray-600"
                                        )}
                                    >
                                        {w.charAt(0).toUpperCase() + w.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Edit button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditing();
                                }}
                                className={cn(
                                    "w-8 h-8 rounded-lg",
                                    "bg-white/90 backdrop-blur-sm hover:bg-white",
                                    "flex items-center justify-center",
                                    "text-gray-600 hover:text-gray-900",
                                    "shadow-lg",
                                    "transition-all duration-150"
                                )}
                            >
                                <Pencil className="w-4 h-4" />
                            </button>

                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveImage();
                                }}
                                className={cn(
                                    "w-8 h-8 rounded-lg",
                                    "bg-white/90 backdrop-blur-sm hover:bg-red-500",
                                    "flex items-center justify-center",
                                    "text-gray-600 hover:text-white",
                                    "shadow-lg",
                                    "transition-all duration-150"
                                )}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Caption input */}
                    <input
                        ref={captionRef}
                        type="text"
                        value={caption}
                        onChange={handleCaptionChange}
                        placeholder="Add a caption..."
                        className={cn(
                            "w-full mt-2 px-2 py-1",
                            "text-sm text-gray-500 text-center",
                            "bg-transparent",
                            "border-none outline-none",
                            "placeholder-gray-400",
                            "focus:text-gray-700"
                        )}
                    />
                </div>
            )}

            {/* Upload/URL modal */}
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
                        {/* Tab buttons */}
                        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setActiveTab("upload")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2",
                                    "px-3 py-2 rounded-md text-sm font-medium",
                                    "transition-colors",
                                    activeTab === "upload"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <Upload className="w-4 h-4" />
                                Upload
                            </button>
                            <button
                                onClick={() => setActiveTab("url")}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2",
                                    "px-3 py-2 rounded-md text-sm font-medium",
                                    "transition-colors",
                                    activeTab === "url"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <Link className="w-4 h-4" />
                                URL
                            </button>
                        </div>

                        {/* Upload tab content */}
                        {activeTab === "upload" && (
                            <div className="flex flex-col gap-3">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />

                                {/* Drop zone */}
                                <div
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-6",
                                        "flex flex-col items-center justify-center gap-2",
                                        "cursor-pointer transition-all",
                                        isDragging
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
                                        isLoading &&
                                            "pointer-events-none opacity-50"
                                    )}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                            <span className="text-sm text-gray-500">
                                                Processing...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload
                                                className={cn(
                                                    "w-8 h-8",
                                                    isDragging
                                                        ? "text-blue-500"
                                                        : "text-gray-400"
                                                )}
                                            />
                                            <span className="text-sm font-medium text-gray-600">
                                                {isDragging
                                                    ? "Drop image here"
                                                    : "Click to upload or drag and drop"}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                JPG, PNG, GIF, WebP up to 10MB
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Preview */}
                                {previewUrl && (
                                    <div className="mt-2">
                                        <div className="relative rounded-lg overflow-hidden bg-gray-100 max-h-48">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-auto max-h-48 object-contain"
                                                onError={() =>
                                                    setPreviewUrl("")
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Alt text input */}
                                <input
                                    type="text"
                                    value={altText}
                                    onChange={(e) => setAltText(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Alt text (for accessibility)..."
                                    className={cn(
                                        "w-full px-3 py-2",
                                        "border border-gray-300 rounded-lg",
                                        "text-sm placeholder-gray-400",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    )}
                                />
                            </div>
                        )}

                        {/* URL tab content */}
                        {activeTab === "url" && (
                            <div className="flex flex-col gap-3">
                                <input
                                    ref={urlInputRef}
                                    type="text"
                                    value={imageUrl}
                                    onChange={handleUrlChange}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Paste image URL..."
                                    className={cn(
                                        "w-full px-3 py-2",
                                        "border border-gray-300 rounded-lg",
                                        "text-sm placeholder-gray-400",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    )}
                                />

                                {/* Preview */}
                                {previewUrl && (
                                    <div className="relative rounded-lg overflow-hidden bg-gray-100 max-h-48">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-auto max-h-48 object-contain"
                                            onError={() => setPreviewUrl("")}
                                        />
                                    </div>
                                )}

                                <input
                                    type="text"
                                    value={altText}
                                    onChange={(e) => setAltText(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Alt text (for accessibility)..."
                                    className={cn(
                                        "w-full px-3 py-2",
                                        "border border-gray-300 rounded-lg",
                                        "text-sm placeholder-gray-400",
                                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    )}
                                />
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={handleCancel}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg",
                                    "text-sm text-gray-600",
                                    "hover:bg-gray-100",
                                    "transition-colors"
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveImage}
                                disabled={!imageUrl.trim() || isLoading}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg",
                                    "text-sm text-white",
                                    "bg-blue-500 hover:bg-blue-600",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-colors"
                                )}
                            >
                                {block.content ? "Update" : "Add Image"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error state */}
            {imageError && !isEditing && (
                <div
                    className={cn(
                        "py-8 px-4",
                        "border-2 border-dashed border-red-300",
                        "rounded-xl bg-red-50",
                        "flex flex-col items-center justify-center gap-2",
                        "text-red-500"
                    )}
                >
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-sm font-medium">
                        Failed to load image
                    </span>
                    <button
                        onClick={() => handleStartEditing()}
                        className={cn(
                            "mt-2 px-3 py-1.5 rounded-lg",
                            "text-sm text-white",
                            "bg-red-500 hover:bg-red-600",
                            "transition-colors"
                        )}
                    >
                        Edit Image
                    </button>
                </div>
            )}
        </div>
    );
}
