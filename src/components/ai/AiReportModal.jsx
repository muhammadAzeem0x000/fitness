import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Calendar, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../ui/Button';

export function AiReportModal({ report, isOpen, onClose }) {
    if (!report) return null;

    const isWeekly = report.report_type === 'weekly';
    const Icon = isWeekly ? Calendar : TrendingUp;
    const title = isWeekly ? 'Weekly Analysis' : 'Monthly Transformation';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 md:p-6"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: '50px', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '50px', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-950 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-zinc-800"
                        >
                            {/* Header */}
                            <div className="flex-none flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-lg">
                                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                            {title}
                                        </h2>
                                        <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Markdown Body */}
                            <div className="flex-1 overflow-y-auto p-5 sm:p-8 custom-scrollbar">
                                <div className="prose dark:prose-invert max-w-none 
                                    prose-headings:text-slate-900 dark:prose-headings:text-blue-50 
                                    prose-a:text-blue-600 dark:prose-a:text-blue-400 
                                    prose-strong:text-slate-900 dark:prose-strong:text-white 
                                    prose-li:text-slate-700 dark:prose-li:text-zinc-300
                                    prose-table:border-collapse prose-table:w-full prose-table:my-6
                                    prose-th:border prose-th:border-slate-300 dark:prose-th:border-zinc-700 prose-th:bg-slate-100 dark:prose-th:bg-zinc-800 prose-th:p-3 prose-th:text-left
                                    prose-td:border prose-td:border-slate-300 dark:prose-td:border-zinc-800 prose-td:p-3
                                    prose-tr:border-b prose-tr:border-slate-200 dark:prose-tr:border-zinc-800
                                ">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {report.report_text}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
