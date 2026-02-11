import React, { useState } from 'react';
import { X, Copy, Check, Share2, Link as LinkIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

export function ShareModal({ isOpen, onClose, shareUrl, workoutSummary }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-md w-full shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Share Workout</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Workout Summary */}
                            <div className="p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                <p className="text-sm text-zinc-400 mb-2">You're sharing:</p>
                                <p className="text-white font-medium whitespace-pre-line">{workoutSummary}</p>
                            </div>

                            {/* Share Link */}
                            <div>
                                <label className="text-sm text-zinc-400 mb-2 block">Share Link</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 px-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-lg font-mono text-sm text-zinc-300 truncate">
                                        {shareUrl}
                                    </div>
                                    <Button
                                        onClick={handleCopy}
                                        className={`gap-2 transition-all ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-4 h-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Anyone with this link can view your workout
                                </p>
                            </div>

                            {/* Native Share (Mobile) */}
                            {navigator.share && (
                                <div className="pt-4 border-t border-zinc-800">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                await navigator.share({
                                                    title: 'My Workout',
                                                    text: workoutSummary,
                                                    url: shareUrl
                                                });
                                            } catch (err) {
                                                console.error('Share failed:', err);
                                            }
                                        }}
                                        variant="secondary"
                                        className="w-full gap-2"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        Share via...
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-zinc-950/30 border-t border-zinc-800 rounded-b-xl">
                            <p className="text-xs text-zinc-600 text-center">
                                💡 The recipient doesn't need a SmartFit account to view
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
