import { useEffect, useRef, useCallback } from "react";

/**
 * useAutoSave - Auto-save document with debounce
 */
export function useAutoSave({
    document,
    saveDocument,
    createSnapshot,
    debounceMs = 1000,
    snapshotIntervalMs = 5 * 60 * 1000 // 5 minutes
}) {
    const saveTimeoutRef = useRef(null);
    const lastSaveRef = useRef(null);
    const lastSnapshotRef = useRef(Date.now());

    // Debounced save function
    const debouncedSave = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            if (document) {
                await saveDocument(document);
                lastSaveRef.current = Date.now();

                // Create snapshot if interval has passed
                if (Date.now() - lastSnapshotRef.current > snapshotIntervalMs) {
                    await createSnapshot(document.id, document.blocks);
                    lastSnapshotRef.current = Date.now();
                }
            }
        }, debounceMs);
    }, [
        document,
        saveDocument,
        createSnapshot,
        debounceMs,
        snapshotIntervalMs
    ]);

    // Trigger save on document changes
    useEffect(() => {
        if (document) {
            debouncedSave();
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [document, debouncedSave]);

    // Save on window blur or close
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (document && saveDocument) {
                // Synchronous save attempt (may not complete)
                saveDocument(document);
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden && document) {
                saveDocument(document);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [document, saveDocument]);

    // Force save now
    const saveNow = useCallback(async () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        if (document) {
            await saveDocument(document);
            lastSaveRef.current = Date.now();
        }
    }, [document, saveDocument]);

    return { saveNow, lastSaved: lastSaveRef.current };
}
