import { AnimatePresence, motion } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";
import { useToastStore } from "../../stores/toastStore";
import { cn } from "../../utils/cn";

/**
 * Toast Container - Renders all active toasts
 */
export function ToastContainer() {
    const { toasts, dismissToast } = useToastStore();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

/**
 * Individual Toast component
 */
function Toast({ toast, onDismiss }) {
    const { message, type } = toast;

    const icons = {
        success: Check,
        error: AlertCircle,
        info: Info
    };

    const colors = {
        success: "bg-green-50 border-green-200 text-green-700",
        error: "bg-red-50 border-red-200 text-red-700",
        info: "bg-blue-50 border-blue-200 text-blue-700"
    };

    const iconColors = {
        success: "text-green-500",
        error: "text-red-500",
        info: "text-blue-500"
    };

    const Icon = icons[type] || Check;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
                "flex items-center gap-3 px-4 py-3",
                "min-w-[200px] max-w-[320px]",
                "bg-white/90 backdrop-blur-xl",
                "rounded-xl shadow-lg shadow-black/10",
                "border border-black/5"
            )}
        >
            <div
                className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    type === "success" && "bg-green-100",
                    type === "error" && "bg-red-100",
                    type === "info" && "bg-blue-100"
                )}
            >
                <Icon
                    className={cn("w-4 h-4", iconColors[type])}
                    strokeWidth={2}
                />
            </div>

            <span className="flex-1 text-[13px] text-gray-700 font-medium">
                {message}
            </span>

            <button
                onClick={onDismiss}
                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
        </motion.div>
    );
}
