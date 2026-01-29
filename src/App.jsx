import { useEffect, useCallback } from "react";
import { Editor } from "./components/Editor/Editor";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { TopBar } from "./components/TopBar/TopBar";
import { useDocumentsStore } from "./stores/documentsStore";
import { useEditorStore } from "./stores/editorStore";
import * as storage from "./services/documentStorage";
import { cn } from "./utils/cn";

function App() {
    const {
        documents,
        activeDocumentId,
        isLoading,
        isSaving,
        lastSaved,
        sidebarCollapsed,
        loadDocuments,
        selectDocument,
        createDocument,
        deleteDocument,
        duplicateDocument,
        renameDocument,
        saveDocument,
        toggleSidebar
    } = useDocumentsStore();

    const { document: editorDocument, loadDocument } = useEditorStore();

    // Get active document data
    const activeDocument = documents.find((d) => d.id === activeDocumentId);

    // Initialize: load documents from IndexedDB
    useEffect(() => {
        storage.initDB().then(() => {
            loadDocuments();
        });
    }, [loadDocuments]);

    // Load active document into editor when it changes
    useEffect(() => {
        if (activeDocumentId && !isLoading) {
            storage.getDocument(activeDocumentId).then((doc) => {
                if (doc) {
                    loadDocument(doc);
                }
            });
        }
    }, [activeDocumentId, isLoading, loadDocument]);

    // Auto-save when editor document changes
    useEffect(() => {
        if (editorDocument && activeDocumentId) {
            const timeout = setTimeout(() => {
                saveDocument(editorDocument);
            }, 1000);

            return () => clearTimeout(timeout);
        }
    }, [editorDocument, activeDocumentId, saveDocument]);

    // Handle rename from TopBar (direct title)
    const handleRenameFromTopBar = useCallback(
        (newTitle) => {
            if (activeDocumentId) {
                renameDocument(activeDocumentId, newTitle);
            }
        },
        [activeDocumentId, renameDocument]
    );

    // Handle rename from Sidebar (with prompt)
    const handleRenameFromSidebar = useCallback(
        (docId) => {
            const doc = documents.find((d) => d.id === docId);
            const newTitle = prompt(
                "Rename document:",
                doc?.title || "Untitled"
            );
            if (newTitle && newTitle.trim()) {
                renameDocument(docId, newTitle.trim());
            }
        },
        [documents, renameDocument]
    );

    // Handle delete with confirmation
    const handleDelete = useCallback(
        (docId) => {
            const targetId = docId || activeDocumentId;
            const doc = documents.find((d) => d.id === targetId);
            if (
                confirm(
                    `Delete "${doc?.title || "Untitled"}"? This cannot be undone.`
                )
            ) {
                deleteDocument(targetId);
            }
        },
        [documents, activeDocumentId, deleteDocument]
    );

    // Handle duplicate
    const handleDuplicate = useCallback(
        (docId) => {
            const targetId = docId || activeDocumentId;
            if (targetId) {
                duplicateDocument(targetId);
            }
        },
        [activeDocumentId, duplicateDocument]
    );

    // Handle export (placeholder for now)
    const handleExport = useCallback(() => {
        // TODO: Implement export functionality
        alert("Export feature coming soon!");
    }, []);

    // Create first document if none exist
    useEffect(() => {
        if (!isLoading && documents.length === 0) {
            createDocument();
        }
    }, [isLoading, documents.length, createDocument]);

    // Keyboard shortcut: Ctrl/Cmd + \ to toggle sidebar
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
                e.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-white flex">
            {/* Sidebar */}
            <Sidebar
                documents={documents}
                activeDocumentId={activeDocumentId}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleSidebar}
                onSelectDocument={selectDocument}
                onCreateDocument={createDocument}
                onDeleteDocument={handleDelete}
                onDuplicateDocument={handleDuplicate}
                onRenameDocument={handleRenameFromSidebar}
                isSaving={isSaving}
                lastSaved={lastSaved}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* TopBar */}
                <TopBar
                    title={activeDocument?.title || "Untitled"}
                    createdAt={activeDocument?.createdAt}
                    updatedAt={activeDocument?.updatedAt}
                    isSidebarVisible={!sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                    onRename={handleRenameFromTopBar}
                    onNewDocument={createDocument}
                    onDelete={() => handleDelete(activeDocumentId)}
                    onDuplicate={() => handleDuplicate(activeDocumentId)}
                    onExport={handleExport}
                />

                {/* Editor */}
                <main className="flex-1 overflow-hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-gray-400 text-sm">
                                Loading...
                            </div>
                        </div>
                    ) : activeDocumentId ? (
                        <Editor />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <p className="text-gray-400 text-sm">
                                No documents
                            </p>
                            <button
                                onClick={createDocument}
                                className={cn(
                                    "px-4 py-2 rounded-lg",
                                    "bg-gray-900 text-white text-sm",
                                    "hover:bg-gray-800",
                                    "transition-colors duration-150"
                                )}
                            >
                                Create document
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default App;
