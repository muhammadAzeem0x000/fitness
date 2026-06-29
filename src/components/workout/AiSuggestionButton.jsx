import React, { useState } from 'react';
import { Sparkles, Loader2, X, Plus, Brain } from 'lucide-react';
import { Button } from '../ui/Button';

import { getInSessionAdvice } from '../../lib/openai';

/**
 * AI Exercise Suggestion Button + Popover
 * Analyzes current exercises in the session and suggests complementary ones.
 */
export function AiSuggestionButton({ currentExercises = [], onAddExercise }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [error, setError] = useState(null);

    const handleGetSuggestions = async () => {
        if (currentExercises.length === 0) return;

        setIsOpen(true);
        setLoading(true);
        setError(null);
        setSuggestions(null);

        try {
            const result = await getInSessionAdvice(currentExercises);
            setSuggestions(result);
        } catch (err) {
            console.error('Suggestion error:', err);
            setError('Failed to get suggestions. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={handleGetSuggestions}
                disabled={currentExercises.length === 0}
                className="border-dashed border-violet-500/30 text-violet-300 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/50 w-full md:w-auto text-xs gap-1.5"
            >
                <Brain className="w-3 h-3" /> AI Suggest
            </Button>

            {/* Suggestion Popover */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <h3 className="text-sm font-semibold text-white">AI Suggestions</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800">
                                <X className="w-4 h-4 text-zinc-400" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-8 gap-2">
                                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                                <span className="text-sm text-zinc-400">Analyzing your session...</span>
                            </div>
                        ) : error ? (
                            <div className="text-sm text-red-400 text-center py-6">{error}</div>
                        ) : suggestions ? (
                            <div className="space-y-3">
                                {/* Analysis */}
                                {suggestions.analysis && (
                                    <p className="text-xs text-zinc-400 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800">
                                        {suggestions.analysis}
                                    </p>
                                )}

                                {/* Suggestion Cards */}
                                {suggestions.suggestions?.map((s, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">{s.name}</p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{s.reason}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onAddExercise(s.name);
                                                // Remove from suggestions
                                                setSuggestions(prev => ({
                                                    ...prev,
                                                    suggestions: prev.suggestions.filter((_, idx) => idx !== i)
                                                }));
                                            }}
                                            className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors shrink-0"
                                            title="Add to workout"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {suggestions.suggestions?.length === 0 && (
                                    <p className="text-sm text-zinc-500 text-center py-4">All suggestions added!</p>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </>
    );
}
