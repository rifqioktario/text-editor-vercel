import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import * as storage from "../services/documentStorage";
import { createDocument as createDocBlock } from "../utils/blocks";

/**
 * Documents Store - Manages multi-document state
 */
export const useDocumentsStore = create(
    immer((set, get) => ({
        // State
        documents: [],
        activeDocumentId: null,
        isLoading: true,
        isSaving: false,
        lastSaved: null,
        sidebarCollapsed: false,

        // ========== Document Actions ==========

        /**
         * Load all documents from IndexedDB
         */
        loadDocuments: async () => {
            set((state) => {
                state.isLoading = true;
            });

            try {
                const documents = await storage.getAllDocuments();
                set((state) => {
                    state.documents = documents;
                    state.isLoading = false;
                    // Select first document if none active
                    if (!state.activeDocumentId && documents.length > 0) {
                        state.activeDocumentId = documents[0].id;
                    }
                });
            } catch (error) {
                console.error("Failed to load documents:", error);
                set((state) => {
                    state.isLoading = false;
                });
            }
        },

        /**
         * Select a document as active
         */
        selectDocument: (documentId) => {
            set((state) => {
                state.activeDocumentId = documentId;
            });
        },

        /**
         * Create a new document
         */
        createDocument: async () => {
            const newDoc = createDocBlock("Untitled");

            try {
                await storage.saveDocument(newDoc);
                set((state) => {
                    state.documents.unshift(newDoc);
                    state.activeDocumentId = newDoc.id;
                });
                return newDoc;
            } catch (error) {
                console.error("Failed to create document:", error);
                return null;
            }
        },

        /**
         * Save the current document
         */
        saveDocument: async (document) => {
            set((state) => {
                state.isSaving = true;
            });

            try {
                await storage.saveDocument(document);
                set((state) => {
                    state.isSaving = false;
                    state.lastSaved = new Date().toISOString();
                    // Update document in list
                    const index = state.documents.findIndex(
                        (d) => d.id === document.id
                    );
                    if (index !== -1) {
                        state.documents[index] = document;
                    }
                });
            } catch (error) {
                console.error("Failed to save document:", error);
                set((state) => {
                    state.isSaving = false;
                });
            }
        },

        /**
         * Delete a document
         */
        deleteDocument: async (documentId) => {
            try {
                await storage.deleteDocument(documentId);
                set((state) => {
                    state.documents = state.documents.filter(
                        (d) => d.id !== documentId
                    );
                    // Select another document if the deleted one was active
                    if (state.activeDocumentId === documentId) {
                        state.activeDocumentId =
                            state.documents.length > 0
                                ? state.documents[0].id
                                : null;
                    }
                });
            } catch (error) {
                console.error("Failed to delete document:", error);
            }
        },

        /**
         * Duplicate a document
         */
        duplicateDocument: async (documentId) => {
            const original = get().documents.find((d) => d.id === documentId);
            if (!original) return;

            const duplicated = {
                ...original,
                id: crypto.randomUUID(),
                title: `${original.title} (copy)`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            try {
                await storage.saveDocument(duplicated);
                set((state) => {
                    const index = state.documents.findIndex(
                        (d) => d.id === documentId
                    );
                    state.documents.splice(index + 1, 0, duplicated);
                    state.activeDocumentId = duplicated.id;
                });
            } catch (error) {
                console.error("Failed to duplicate document:", error);
            }
        },

        /**
         * Rename a document
         */
        renameDocument: async (documentId, newTitle) => {
            try {
                set((state) => {
                    const doc = state.documents.find(
                        (d) => d.id === documentId
                    );
                    if (doc) {
                        doc.title = newTitle;
                        doc.updatedAt = new Date().toISOString();
                    }
                });
                const doc = get().documents.find((d) => d.id === documentId);
                if (doc) {
                    await storage.saveDocument(doc);
                }
            } catch (error) {
                console.error("Failed to rename document:", error);
            }
        },

        /**
         * Create a version snapshot
         */
        createSnapshot: async (documentId, blocks) => {
            try {
                await storage.createSnapshot(documentId, blocks);
                await storage.cleanupSnapshots(documentId);
            } catch (error) {
                console.error("Failed to create snapshot:", error);
            }
        },

        // ========== UI State ==========

        /**
         * Toggle sidebar collapsed state
         */
        toggleSidebar: () => {
            set((state) => {
                state.sidebarCollapsed = !state.sidebarCollapsed;
            });
        },

        /**
         * Get active document
         */
        getActiveDocument: () => {
            const state = get();
            return state.documents.find((d) => d.id === state.activeDocumentId);
        }
    }))
);
