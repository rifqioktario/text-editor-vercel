/**
 * Toast Store
 * Manages toast notification state
 */
import { create } from "zustand";

export const useToastStore = create((set) => ({
    toasts: [],

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success' | 'error' | 'info'
     * @param {number} duration - Auto-dismiss duration in ms
     */
    showToast: (message, type = "success", duration = 2000) => {
        const id = Date.now();

        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));

        // Auto dismiss
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }));
        }, duration);
    },

    /**
     * Dismiss a specific toast
     * @param {number} id - Toast ID
     */
    dismissToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    }
}));
