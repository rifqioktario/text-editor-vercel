/**
 * IndexedDB Document Storage Service
 * Handles persistence of documents locally
 */

const DB_NAME = "text-editor-db";
const DB_VERSION = 1;
const DOCUMENTS_STORE = "documents";
const SNAPSHOTS_STORE = "snapshots";

let db = null;

/**
 * Initialize the database
 */
export async function initDB() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Documents store
            if (!database.objectStoreNames.contains(DOCUMENTS_STORE)) {
                const docStore = database.createObjectStore(DOCUMENTS_STORE, {
                    keyPath: "id"
                });
                docStore.createIndex("updatedAt", "updatedAt", {
                    unique: false
                });
                docStore.createIndex("title", "title", { unique: false });
            }

            // Snapshots store for version history
            if (!database.objectStoreNames.contains(SNAPSHOTS_STORE)) {
                const snapStore = database.createObjectStore(SNAPSHOTS_STORE, {
                    keyPath: "id"
                });
                snapStore.createIndex("documentId", "documentId", {
                    unique: false
                });
                snapStore.createIndex("timestamp", "timestamp", {
                    unique: false
                });
            }
        };
    });
}

/**
 * Get all documents (metadata only for performance)
 */
export async function getAllDocuments() {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCUMENTS_STORE, "readonly");
        const store = transaction.objectStore(DOCUMENTS_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            // Sort by updatedAt descending
            const docs = request.result.sort(
                (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            resolve(docs);
        };
    });
}

/**
 * Get a single document by ID
 */
export async function getDocument(id) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCUMENTS_STORE, "readonly");
        const store = transaction.objectStore(DOCUMENTS_STORE);
        const request = store.get(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Save a document (create or update)
 */
export async function saveDocument(document) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCUMENTS_STORE, "readwrite");
        const store = transaction.objectStore(DOCUMENTS_STORE);

        const docToSave = {
            ...document,
            updatedAt: new Date().toISOString()
        };

        const request = store.put(docToSave);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(docToSave);
    });
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOCUMENTS_STORE, "readwrite");
        const store = transaction.objectStore(DOCUMENTS_STORE);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(true);
    });
}

/**
 * Create a version snapshot
 */
export async function createSnapshot(documentId, blocks) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite");
        const store = transaction.objectStore(SNAPSHOTS_STORE);

        const snapshot = {
            id: crypto.randomUUID(),
            documentId,
            blocks: JSON.parse(JSON.stringify(blocks)), // Deep clone
            timestamp: new Date().toISOString()
        };

        const request = store.add(snapshot);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(snapshot);
    });
}

/**
 * Get snapshots for a document
 */
export async function getSnapshots(documentId, limit = 10) {
    await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(SNAPSHOTS_STORE, "readonly");
        const store = transaction.objectStore(SNAPSHOTS_STORE);
        const index = store.index("documentId");
        const request = index.getAll(documentId);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            // Sort by timestamp descending and limit
            const snapshots = request.result
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
            resolve(snapshots);
        };
    });
}

/**
 * Delete old snapshots (keep last N)
 */
export async function cleanupSnapshots(documentId, keepCount = 20) {
    const snapshots = await getSnapshots(documentId, 100);
    if (snapshots.length <= keepCount) return;

    await initDB();
    const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite");
    const store = transaction.objectStore(SNAPSHOTS_STORE);

    // Delete snapshots beyond keepCount
    const toDelete = snapshots.slice(keepCount);
    for (const snapshot of toDelete) {
        store.delete(snapshot.id);
    }
}
