import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'success', title, description, duration = 4000 }) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, type, title, description, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed z-[100] flex flex-col items-center gap-3 pointer-events-none top-4 sm:top-6 left-1/2 -translate-x-1/2 w-full px-4 max-w-sm sm:w-96">        {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
            </div>
        </ToastContext.Provider>
    );
};
const ToastItem = ({ toast, onRemove }) => {
    const [isClosing, setIsClosing] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => handleClose(), toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration]);

    const handleClose = () => {
        setIsClosing(true);

        setTimeout(() => onRemove(toast.id), 300);
    };
    const theme = {
        success: {
            icon: <CheckCircle2 className="text-emerald-500" size={24} />,
            bg: 'bg-emerald-500',
            border: 'border-emerald-100',
            lightBg: 'bg-emerald-50/50'
        },
        error: {
            icon: <AlertCircle className="text-red-500" size={24} />,
            bg: 'bg-red-500',
            border: 'border-red-100',
            lightBg: 'bg-red-50/50'
        },
        info: {
            icon: <Info className="text-blue-500" size={24} />,
            bg: 'bg-blue-500',
            border: 'border-blue-100',
            lightBg: 'bg-blue-50/50'
        }
    }[toast.type];

    return (
        <>
            <style>{`
       @keyframes toastEnter {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastLeave {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-20px) scale(0.95); }
        }
        @keyframes shrinkProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-toast-enter { animation: toastEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-toast-leave { animation: toastLeave 0.3s ease-in forwards; }
        .animate-progress { animation: shrinkProgress linear forwards; }
      `}</style>

            <div
                className={`pointer-events-auto relative overflow-hidden bg-white/90 backdrop-blur-xl border ${theme.border} rounded-2xl p-4 shadow-2xl shadow-slate-200/50 flex items-start gap-3 w-full ${isClosing ? 'animate-toast-leave' : 'animate-toast-enter'}`}
            >
                {/* Icon */}
                <div className={`p-2 rounded-full ${theme.lightBg} shrink-0`}>
                    {theme.icon}
                </div>

                {/* Text Content */}
                <div className="flex-1 pt-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{toast.title}</h4>
                    {toast.description && (
                        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                            {toast.description}
                        </p>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={16} />
                </button>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-100">
                    <div
                        className={`h-full ${theme.bg} animate-progress`}
                        style={{ animationDuration: `${toast.duration}ms` }}
                    ></div>
                </div>
            </div>
        </>
    );
};