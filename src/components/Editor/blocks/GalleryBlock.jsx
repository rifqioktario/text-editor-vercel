import { useState, useRef, useEffect } from "react";
import { Plus, X, Image as ImageIcon, GripVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../../utils/cn";

/**
 * GalleryBlock - Horizontal scrollable image gallery
 */
export function GalleryBlock({
    block,
    isActive,
    onFocus,
    onKeyDown: parentOnKeyDown,
    onUpdate
}) {
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState("");
    const [newImageAlt, setNewImageAlt] = useState("");
    const scrollRef = useRef(null);
    const urlInputRef = useRef(null);
    const containerRef = useRef(null);

    const images = block.properties?.images || [];

    // Focus URL input when adding
    useEffect(() => {
        if (isAddingImage && urlInputRef.current) {
            urlInputRef.current.focus();
        }
    }, [isAddingImage]);

    const handleAddImage = () => {
        if (!newImageUrl.trim()) return;

        const newImage = {
            id: crypto.randomUUID(),
            url: newImageUrl.trim(),
            alt: newImageAlt.trim() || "Image",
            caption: ""
        };

        onUpdate?.({
            ...block,
            properties: {
                ...block.properties,
                images: [...images, newImage]
            }
        });

        setNewImageUrl("");
        setNewImageAlt("");
        setIsAddingImage(false);
    };

    const handleRemoveImage = (imageId) => {
        onUpdate?.({
            ...block,
            properties: {
                ...block.properties,
                images: images.filter((img) => img.id !== imageId)
            }
        });
    };

    // Handle parent keyboard events (Enter/Backspace)
    const handleContainerKeyDown = (e) => {
        parentOnKeyDown?.(e, block.id);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddImage();
        }
        if (e.key === "Escape") {
            setIsAddingImage(false);
            setNewImageUrl("");
            setNewImageAlt("");
        }
    };

    // Empty state
    if (images.length === 0 && !isAddingImage) {
        return (
            <div
                ref={containerRef}
                tabIndex={0}
                data-block-type="GALLERY"
                className={cn(
                    "relative py-4 group outline-none",
                    isActive && "ring-1 ring-gray-300 rounded-lg"
                )}
                onClick={onFocus}
                onKeyDown={handleContainerKeyDown}
            >
                <button
                    onClick={() => setIsAddingImage(true)}
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
                    <span className="text-sm font-medium">
                        Add images to gallery
                    </span>
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            data-block-type="GALLERY"
            className={cn(
                "relative py-4 group outline-none",
                isActive && "ring-1 ring-gray-300 rounded-lg"
            )}
            onClick={onFocus}
            onKeyDown={handleContainerKeyDown}
        >
            {/* Gallery scroll container */}
            <div className="relative">
                {/* Left fade */}
                <div
                    className={cn(
                        "absolute left-0 top-0 bottom-0 w-12 z-10",
                        "bg-linear-to-r from-white to-transparent",
                        "pointer-events-none",
                        images.length <= 3 && "hidden"
                    )}
                />

                {/* Right fade */}
                <div
                    className={cn(
                        "absolute right-0 top-0 bottom-0 w-12 z-10",
                        "bg-linear-to-l from-white to-transparent",
                        "pointer-events-none",
                        images.length <= 3 && "hidden"
                    )}
                />

                {/* Scrollable container */}
                <div
                    ref={scrollRef}
                    className={cn(
                        "flex gap-4 overflow-x-auto pb-2",
                        "scroll-smooth snap-x snap-mandatory",
                        "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                    )}
                    style={{ scrollbarWidth: "thin" }}
                >
                    <AnimatePresence mode="popLayout">
                        {images.map((image) => (
                            <motion.div
                                key={image.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, x: 50 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "relative shrink-0 snap-start",
                                    "group/card"
                                )}
                            >
                                <div
                                    className={cn(
                                        "relative w-48 h-64 rounded-xl overflow-hidden",
                                        "bg-gray-100",
                                        "shadow-md hover:shadow-xl",
                                        "transform hover:scale-[1.03]",
                                        "transition-all duration-200"
                                    )}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src =
                                                "https://via.placeholder.com/192x256?text=Image";
                                        }}
                                    />

                                    {/* Remove button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage(image.id);
                                        }}
                                        className={cn(
                                            "absolute top-2 right-2",
                                            "w-6 h-6 rounded-full",
                                            "bg-black/50 hover:bg-red-500",
                                            "flex items-center justify-center",
                                            "text-white",
                                            "opacity-0 group-hover/card:opacity-100",
                                            "transition-all duration-150"
                                        )}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    {/* Drag handle */}
                                    <div
                                        className={cn(
                                            "absolute top-2 left-2",
                                            "p-1 rounded",
                                            "bg-black/30",
                                            "opacity-0 group-hover/card:opacity-100",
                                            "cursor-grab active:cursor-grabbing",
                                            "transition-opacity duration-150"
                                        )}
                                    >
                                        <GripVertical className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Add image button */}
                    {!isAddingImage && (
                        <button
                            onClick={() => setIsAddingImage(true)}
                            className={cn(
                                "shrink-0 w-48 h-64",
                                "border-2 border-dashed border-gray-300",
                                "rounded-xl",
                                "flex flex-col items-center justify-center gap-2",
                                "text-gray-400 hover:text-gray-600",
                                "hover:border-gray-400 hover:bg-gray-50/50",
                                "transition-all duration-200"
                            )}
                        >
                            <Plus className="w-6 h-6" />
                            <span className="text-sm">Add image</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Add image modal */}
            <AnimatePresence>
                {isAddingImage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                            "mt-4 p-4",
                            "bg-white border border-gray-200",
                            "rounded-xl shadow-lg"
                        )}
                    >
                        <div className="flex flex-col gap-3">
                            <input
                                ref={urlInputRef}
                                type="text"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Image URL..."
                                className={cn(
                                    "w-full px-3 py-2",
                                    "border border-gray-300 rounded-lg",
                                    "text-sm placeholder-gray-400",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                )}
                            />
                            <input
                                type="text"
                                value={newImageAlt}
                                onChange={(e) => setNewImageAlt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Alt text (optional)..."
                                className={cn(
                                    "w-full px-3 py-2",
                                    "border border-gray-300 rounded-lg",
                                    "text-sm placeholder-gray-400",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                )}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setIsAddingImage(false);
                                        setNewImageUrl("");
                                        setNewImageAlt("");
                                    }}
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
                                    onClick={handleAddImage}
                                    disabled={!newImageUrl.trim()}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg",
                                        "text-sm text-white",
                                        "bg-blue-500 hover:bg-blue-600",
                                        "disabled:opacity-50 disabled:cursor-not-allowed",
                                        "transition-colors"
                                    )}
                                >
                                    Add Image
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
