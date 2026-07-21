import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false
}) {
    // Handle Escape key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    // Prevent body scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Glassmorphic Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => !isLoading && onClose()}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl z-10"
                    >
                        {/* Close button */}
                        <button
                            onClick={() => !isLoading && onClose()}
                            disabled={isLoading}
                            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${
                                    variant === 'danger'
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                    {variant === 'danger' ? (
                                        <Trash2 className="w-6 h-6" />
                                    ) : (
                                        <AlertTriangle className="w-6 h-6" />
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {title}
                                </h3>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                                {description}
                            </p>

                            {/* Buttons footer */}
                            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 w-full">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200/50 dark:border-zinc-700/50 transition-all duration-200 disabled:opacity-50"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onConfirm();
                                    }}
                                    disabled={isLoading}
                                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all duration-200 disabled:opacity-50 ${
                                        variant === 'danger'
                                            ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20 active:scale-[0.98]'
                                            : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20 active:scale-[0.98]'
                                    }`}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
