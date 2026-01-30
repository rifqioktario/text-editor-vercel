import { useState, useRef, useEffect } from "react";
import {
    Plus,
    X,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Upload,
    Link,
    Loader2,
    GripVertical,
    Trash2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "../../../utils/cn";
import { useEditorStore } from "../../../stores/editorStore";

/**
 * SortablePoster - Individual poster component for drag & drop
 * Implements "Netflix-style" hover effects: scale up, z-index boost, shadow.
 */
function SortablePoster({
    image,
    isActive,
    isPendingDelete,
    onClick,
    onRemove
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto"
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layoutId={image.id}
            animate={
                isPendingDelete
                    ? {
                          x: [0, -4, 4, -4, 4, 0],
                          transition: { duration: 0.4 }
                      }
                    : {}
            }
            className={cn(
                "relative shrink-0 group/poster cursor-pointer snap-start",
                "transition-all duration-300 ease-out",
                // Base width/height - Portrait 2:3 ratio
                "w-48 aspect-2/3",
                isDragging && "opacity-50 scale-95 grayscale"
            )}
            onClick={onClick}
        >
            {/* Main Card Container */}
            <div
                className={cn(
                    "w-full h-full rounded-lg overflow-hidden relative bg-gray-100",
                    "transition-all duration-300 will-change-transform",
                    // The "Pop" effect
                    !isDragging &&
                        "hover:scale-105 hover:z-20 hover:shadow-2xl hover:ring-2 hover:ring-white/50",
                    // Active selection state
                    isActive
                        ? "ring-2 ring-blue-500 shadow-xl scale-[1.02] z-10"
                        : "shadow-md hover:shadow-lg",
                    // Delete state
                    isPendingDelete &&
                        "ring-4 ring-red-500/50 opacity-100 scale-[1.02] z-20 grayscale-[0.5]"
                )}
            >
                <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/poster:scale-110"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300" />

                {/* Caption placeholder (optional future feature) */}
                {/* <div className="absolute bottom-0 left-0 p-3 opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium truncate w-full">{image.alt}</p>
                </div> */}
            </div>

            {/* Pending Delete Tooltip */}
            <AnimatePresence>
                {isPendingDelete && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl z-50 pointer-events-none"
                    >
                        Press Backspace to Delete
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-600"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Remove button (Top-Right) */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(image.id);
                }}
                className={cn(
                    "absolute -top-2 -right-2 z-30",
                    "w-7 h-7 rounded-full text-white shadow-lg",
                    "flex items-center justify-center",
                    "opacity-0 group-hover/poster:opacity-100",
                    "transition-all duration-200 transform",
                    "hover:scale-110",
                    isPendingDelete
                        ? "bg-red-600 opacity-100 scale-110"
                        : "bg-black/60 backdrop-blur-md hover:bg-red-500"
                )}
                title="Remove image"
            >
                {isPendingDelete ? (
                    <Trash2 className="w-3.5 h-3.5" />
                ) : (
                    <X className="w-3.5 h-3.5" />
                )}
            </button>

            {/* Drag Handle (Top-Left) */}
            {!isPendingDelete && (
                <div
                    {...attributes}
                    {...listeners}
                    className={cn(
                        "absolute top-2 left-2 z-30",
                        "w-7 h-7 rounded-full bg-black/40 backdrop-blur-md",
                        "flex items-center justify-center text-white",
                        "opacity-0 group-hover/poster:opacity-100",
                        "cursor-grab active:cursor-grabbing",
                        "transition-all duration-200 hover:bg-black/60 hover:scale-105"
                    )}
                    title="Drag to reorder"
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </div>
            )}
        </motion.div>
    );
}

/**
 * GalleryBlock - "Netflix-style" Horizontal Row Experience
 */
export function GalleryBlock({
    block,
    isActive,
    onFocus,
    onKeyDown: parentOnKeyDown,
    onUpdate
}) {
    const deleteBlock = useEditorStore((state) => state.deleteBlock);
    const [isAddingImage, setIsAddingImage] = useState(false);
    const [activeTab, setActiveTab] = useState("upload"); // "upload" | "url"
    const [uploadUrl, setUploadUrl] = useState("");
    const [uploadError, setUploadError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0); // Used for selection/focus
    const [isDraggingFile, setIsDraggingFile] = useState(false);

    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const containerRef = useRef(null);
    const fileInputRef = useRef(null);
    const urlInputRef = useRef(null);
    const scrollContainerRef = useRef(null);

    const images = block.properties?.images || [];
    const activeImage = images[activeImageIndex];

    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    // Focus management for modal
    useEffect(() => {
        if (isAddingImage && activeTab === "url" && urlInputRef.current) {
            urlInputRef.current.focus();
        }
    }, [isAddingImage, activeTab]);

    // Ensure active index is valid (Render-phase update to avoid effect warning)
    if (images.length > 0 && activeImageIndex >= images.length) {
        setActiveImageIndex(Math.max(0, images.length - 1));
    }

    // Clear pending delete after timeout
    useEffect(() => {
        if (pendingDeleteId) {
            const timer = setTimeout(() => {
                setPendingDeleteId(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [pendingDeleteId]);

    // Smart Scrolling to Active Item
    useEffect(() => {
        if (isActive && scrollContainerRef.current && images.length > 0) {
            // We need to find the DOM node corresponding to the active index.
            // Since DndKit or Fragments might obscure direct children index, we use querySelector
            // targeting our known classes or attributes.
            // But simple index access on children usually works if structure is flat.
            // The structure is: scrollContainer -> DndContext -> SortableContext -> [Posters..., AddButton]
            // Note: Context providers don't emit DOM nodes.
            // So scrollContainer.children SHOULD contain the Poster divs directly.

            const container = scrollContainerRef.current;
            const items = container.querySelectorAll(".group\\/poster"); // Select by our custom group class

            if (items[activeImageIndex]) {
                items[activeImageIndex].scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
            }
        }
    }, [activeImageIndex, isActive, images.length]);

    // Keyboard handlers
    const handleContainerKeyDown = (e) => {
        // Arrow navigation
        if (isActive && !isAddingImage && images.length > 0) {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                navigate(-1);
                setPendingDeleteId(null);
                return;
            }
            if (e.key === "ArrowRight") {
                e.preventDefault();
                navigate(1);
                setPendingDeleteId(null);
                return;
            }

            // Deletion Logic
            if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                e.stopPropagation();

                if (!activeImage) return;

                if (pendingDeleteId === activeImage.id) {
                    // Confirmed delete
                    const newImages = images.filter(
                        (img) => img.id !== activeImage.id
                    );
                    updateImages(newImages);
                    setPendingDeleteId(null);
                    // Selection update handled by effect
                } else {
                    // Stage 1: Warning
                    setPendingDeleteId(activeImage.id);
                }
                return;
            }

            if (e.key === "Escape") {
                if (pendingDeleteId) {
                    setPendingDeleteId(null);
                    e.stopPropagation();
                    return;
                }
            }
        }
        parentOnKeyDown?.(e, block.id);
    };

    // Navigation
    const navigate = (direction) => {
        if (images.length === 0) return;
        let newIndex = activeImageIndex + direction;

        // Clamping logic
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= images.length) newIndex = images.length - 1;

        setActiveImageIndex(newIndex);
    };

    // Update images helper
    const updateImages = (newImages) => {
        onUpdate?.({
            ...block,
            properties: { ...block.properties, images: newImages }
        });
    };

    // Add Image logic
    const handleAddImage = (url, alt = "Gallery Image") => {
        const newImage = {
            id: crypto.randomUUID(),
            url,
            alt,
            caption: ""
        };
        updateImages([...images, newImage]);
        setActiveImageIndex(images.length); // Switch to new image (which is now last)
        setIsAddingImage(false);
        setUploadUrl("");
        setUploadError("");
    };

    const validateAndAddUrl = () => {
        if (!uploadUrl.trim()) return;

        setIsLoading(true);
        const img = new Image();
        img.onload = () => {
            handleAddImage(uploadUrl.trim());
            setIsLoading(false);
        };
        img.onerror = () => {
            setUploadError("Invalid image URL or unable to load.");
            setIsLoading(false);
        };
        img.src = uploadUrl.trim();
    };

    // File Upload Handlers
    const processFile = (file) => {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => handleAddImage(e.target.result, file.name);
        reader.readAsDataURL(file);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(processFile);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingFile(false);
        const files = Array.from(e.dataTransfer.files || []);
        files.forEach(processFile);
    };

    // Drag & Drop Reorder
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);

            const newImages = arrayMove(images, oldIndex, newIndex);
            updateImages(newImages);
            setActiveImageIndex(newIndex);
        }
    };

    // Empty State
    if (images.length === 0 && !isAddingImage) {
        return (
            <div
                ref={containerRef}
                tabIndex={0}
                data-block-type="GALLERY"
                className={cn(
                    "relative py-6 group outline-none",
                    isActive && "ring-1 ring-gray-300 rounded-xl"
                )}
                onClick={onFocus}
                onKeyDown={handleContainerKeyDown}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
            >
                <div
                    onClick={() => setIsAddingImage(true)}
                    className={cn(
                        "relative w-full py-20",
                        "border-2 border-dashed rounded-xl",
                        "flex flex-col items-center justify-center gap-4",
                        "cursor-pointer transition-all duration-300",
                        isDraggingFile
                            ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    )}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteBlock(block.id);
                        }}
                        className={cn(
                            "absolute top-4 right-4 z-20",
                            "p-2 rounded-full",
                            "text-gray-400 hover:text-red-600 hover:bg-red-50",
                            "transition-all duration-200 ease-in-out",
                            "cursor-pointer hover:scale-110 active:scale-95",
                            "opacity-0 group-hover:opacity-100"
                        )}
                        title="Remove Gallery"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>

                    <div
                        className={cn(
                            "p-5 rounded-full bg-white shadow-sm mb-2 transition-transform duration-300 group-hover:scale-110",
                            isDraggingFile ? "text-blue-500" : "text-gray-400"
                        )}
                    >
                        <ImageIcon className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Create Image Gallery
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Drag & drop photos here or click to browse
                        </p>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Add Images
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            data-block-type="GALLERY"
            className={cn(
                "relative py-6 group outline-none select-none max-w-full"
                // No outer ring when populated, looks cleaner for Netflix style
            )}
            onClick={onFocus}
            onKeyDown={handleContainerKeyDown}
        >
            {/* Scrollable Horizontal Container */}
            <div
                ref={scrollContainerRef}
                className={cn(
                    "flex items-center gap-4 overflow-x-auto pb-8 pt-4 px-4",
                    // Scroll Snapping & Behavior
                    "snap-x snap-mandatory scroll-smooth",
                    // Hide default scrollbar but keep functionality
                    "scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300"
                    // Masking for side fade effect if desired, but sticking to clean distinct cards for now
                )}
                style={{ scrollbarGutter: "stable" }}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={images.map((img) => img.id)}
                        strategy={horizontalListSortingStrategy}
                    >
                        {images.map((image, index) => (
                            <SortablePoster
                                key={image.id}
                                image={image}
                                isActive={
                                    isActive && index === activeImageIndex
                                }
                                isPendingDelete={pendingDeleteId === image.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFocus?.();
                                    setActiveImageIndex(index);
                                    if (pendingDeleteId !== image.id)
                                        setPendingDeleteId(null);
                                }}
                                onRemove={(id) => {
                                    onFocus?.();
                                    const newImages = images.filter(
                                        (img) => img.id !== id
                                    );
                                    updateImages(newImages);
                                    if (pendingDeleteId === id)
                                        setPendingDeleteId(null);
                                }}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {/* Add Button (Last item in list) */}
                <button
                    onClick={() => setIsAddingImage(true)}
                    className={cn(
                        "shrink-0 w-48 aspect-2/3 rounded-lg",
                        "border-2 border-dashed border-gray-200",
                        "flex flex-col items-center justify-center gap-3",
                        "text-gray-400 hover:text-gray-600 hover:border-gray-400 hover:bg-gray-50",
                        "transition-all duration-300 snap-start",
                        "group/add"
                    )}
                    title="Add more images"
                >
                    <div className="p-3 rounded-full bg-gray-50 group-hover/add:bg-white group-hover/add:shadow-md transition-all duration-300">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">Add Image</span>
                </button>
            </div>

            {/* Selection/Action Bar (Optional - appears below active item or container) */}
            {/* Only show brief tip if active and no interaction recently? Keeping it clean for now. */}

            {/* Add Image Modal Overlay */}
            <AnimatePresence>
                {isAddingImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAddingImage(false);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Add to Gallery
                                </h3>
                                <button
                                    onClick={() => setIsAddingImage(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Tabs */}
                                <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl">
                                    <button
                                        onClick={() => setActiveTab("upload")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            activeTab === "upload"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        <Upload className="w-4 h-4" /> Upload
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("url")}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                            activeTab === "url"
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        <Link className="w-4 h-4" /> Link
                                    </button>
                                </div>

                                {activeTab === "upload" ? (
                                    <div
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all group"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <div className="p-4 rounded-full bg-blue-50 text-blue-500 group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-base font-semibold text-gray-700">
                                                Click to upload
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                SVG, PNG, JPG or GIF (max. 5MB)
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                                                Image URL
                                            </label>
                                            <input
                                                ref={urlInputRef}
                                                type="text"
                                                value={uploadUrl}
                                                onChange={(e) =>
                                                    setUploadUrl(e.target.value)
                                                }
                                                onKeyDown={(e) =>
                                                    e.key === "Enter" &&
                                                    validateAndAddUrl()
                                                }
                                                placeholder="https://example.com/image.jpg"
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            />
                                            {uploadError && (
                                                <span className="text-xs text-red-500 flex items-center gap-1">
                                                    <X className="w-3 h-3" />{" "}
                                                    {uploadError}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={validateAndAddUrl}
                                            disabled={
                                                isLoading || !uploadUrl.trim()
                                            }
                                            className={cn(
                                                "w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium",
                                                "hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed",
                                                "flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                            )}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>Add Image to Gallery</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
