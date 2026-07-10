import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage } from '../../lib/aiChat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useWeight } from '../../hooks/useWeight';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useSubscription } from '../../hooks/useSubscription';
import { usePricing } from '../../context/PricingContext';
import { checkFeatureUsage, incrementFeatureUsage } from '../../lib/featureUsage';
import { useNavigate } from 'react-router-dom';

import { AnimatePresence, motion } from 'framer-motion';

const QUICK_PROMPTS = [
    "Am I overtraining?",
    "What should I work on today?",
    "How's my progress this week?",
    "Give me a deload week plan",
    "Tips for better sleep & recovery",
    "How to break through a plateau?",
];

export function AiChat() {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const { weightHistory } = useWeight(user?.id);
    const { workoutLogs, routines } = useWorkouts(user?.id);

    // Fetch all nutrition
    const { data: allNutrition } = useQuery({
        queryKey: ['allNutrition', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });
            return data || [];
        },
        enabled: !!user?.id
    });
    const { isPremium, isLoading: subLoading } = useSubscription();
    const { openPricing } = usePricing();
    const navigate = useNavigate();

    // Fetch feature usage for free tier indicator
    const { data: usageData } = useQuery({
        queryKey: ['featureUsage', user?.id, 'ai_chat'],
        queryFn: () => checkFeatureUsage(user.id, 'ai_chat', 5, 30),
        enabled: !!user?.id && !isPremium,
    });

    const queryClient = useQueryClient();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Reset textarea height when input is cleared
    useEffect(() => {
        if (inputRef.current && input === '') {
            inputRef.current.style.height = 'auto';
        }
    }, [input]);

    // Build user context for the AI
    const buildUserContext = () => {
        const latestWeight = weightHistory?.length > 0
            ? weightHistory[weightHistory.length - 1].weight
            : null;

        // Filter dates for last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        // Recent workout history (14 days)
        let workoutHistoryStr = "No recent workout data.";
        const recentWorkouts = workoutLogs?.filter(w => new Date(w.date) >= fourteenDaysAgo) || [];
        if (recentWorkouts.length > 0) {
            workoutHistoryStr = recentWorkouts.map(w => {
                let exerciseNames = [];
                const exData = w.exercises;
                if (exData && typeof exData === 'object' && !Array.isArray(exData)) {
                    exerciseNames = Object.keys(exData);
                } else if (Array.isArray(exData)) {
                    exerciseNames = exData.map(e => e.name || e);
                }
                return `- ${w.type || 'Workout'} (${new Date(w.date).toLocaleDateString()}): ${exerciseNames.join(', ')}`;
            }).join('\n');
        }

        // Full routines
        let routineListStr = "No saved routines.";
        if (routines && routines.length > 0) {
            routineListStr = routines.map(r => {
                const exData = r.exercises || [];
                const names = Array.isArray(exData) ? exData.map(e => e.name || e).join(', ') : '';
                return `- ${r.name}: ${names}`;
            }).join('\n');
        }

        // Recent nutrition history (14 days)
        let nutritionHistoryStr = "No recent nutrition data.";
        const recentNutrition = allNutrition?.filter(n => new Date(n.date) >= fourteenDaysAgo) || [];
        if (recentNutrition.length > 0) {
            const groupedByDate = {};
            recentNutrition.forEach(n => {
                const d = new Date(n.date).toLocaleDateString();
                if (!groupedByDate[d]) groupedByDate[d] = { meals: [], totalCals: 0, totalP: 0, totalC: 0, totalF: 0 };
                groupedByDate[d].meals.push(`${n.food_text || n.meal_type} (${n.calories}kcal)`);
                groupedByDate[d].totalCals += n.calories || 0;
                groupedByDate[d].totalP += n.protein || 0;
                groupedByDate[d].totalC += n.carbs || 0;
                groupedByDate[d].totalF += n.fats || 0;
            });

            nutritionHistoryStr = Object.entries(groupedByDate).map(([date, data]) => {
                return `- ${date}: ${data.meals.join(', ')} — Total: ${data.totalCals}kcal (P:${data.totalP}g, C:${data.totalC}g, F:${data.totalF}g)`;
            }).join('\\n');
        }

        // Simple streak calculation
        let currentStreak = 0;
        if (workoutLogs && workoutLogs.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sorted = [...workoutLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
            for (let i = 0; i < Math.min(sorted.length, 30); i++) {
                const logDate = new Date(sorted[i].date);
                logDate.setHours(0, 0, 0, 0);
                const daysDiff = Math.floor((today - logDate) / (1000 * 60 * 60 * 24));
                if (daysDiff <= i + 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }

        return {
            displayName: profile?.display_name,
            currentWeight: latestWeight || profile?.current_weight,
            height: profile?.height,
            targetWeight: profile?.goal_weight,
            workoutDays: profile?.workout_days,
            workoutHistory: workoutHistoryStr,
            routineList: routineListStr,
            nutritionHistory: nutritionHistoryStr,
            totalWorkouts: workoutLogs?.length || 0,
            currentStreak,
        };
    };

    const handleSend = async (messageText) => {
        const text = (messageText || input).trim();
        if (!text || isStreaming) return;

        setError(null);

        // Check quota for free users
        if (!isPremium) {
            try {
                const quota = await checkFeatureUsage(user.id, 'ai_chat', 5, 30);
                if (!quota.allowed) {
                    const resetDate = quota.resetDate.toLocaleDateString();
                    setError(`limit_reached:You've reached your free limit of 5 AI messages this month. Your limit resets on ${resetDate}.`);
                    setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                    return;
                }
            } catch (err) {
                // If feature_usage table doesn't exist yet, allow the message
                console.warn('Feature usage check failed:', err);
            }
        }

        // Add user message
        const userMessage = { role: 'user', content: text, timestamp: Date.now() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');

        // Add placeholder for assistant
        const assistantPlaceholder = { role: 'assistant', content: '', timestamp: Date.now() + 1, isStreaming: true };
        setMessages([...updatedMessages, assistantPlaceholder]);
        setIsStreaming(true);

        try {
            const context = buildUserContext();

            // Only pass last 10 messages for context window management
            const chatHistory = updatedMessages.slice(-10).map(m => ({
                role: m.role,
                content: m.content
            }));

            const fullResponse = await sendChatMessage(chatHistory, context, (streamedText) => {
                // Update the assistant message as chunks arrive
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx]?.role === 'assistant') {
                        newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: streamedText };
                    }
                    return newMsgs;
                });
            });

            // Finalize the message
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                if (newMsgs[lastIdx]?.role === 'assistant') {
                    newMsgs[lastIdx] = { ...newMsgs[lastIdx], content: fullResponse, isStreaming: false };
                }
                return newMsgs;
            });

            // Increment usage for free users
            if (!isPremium) {
                try {
                    await incrementFeatureUsage(user.id, 'ai_chat');
                    queryClient.invalidateQueries(['featureUsage', user.id, 'ai_chat']);
                } catch (err) {
                    console.warn('Feature usage increment failed:', err);
                }
            }
        } catch (err) {
            console.error('Chat error:', err);
            // Remove the placeholder on error
            setMessages(updatedMessages);
            setError(err.message || 'Failed to get a response');
            setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
        } finally {
            setIsStreaming(false);
            // Only auto-focus on desktop so mobile keyboards don't block the AI's response
            if (window.innerWidth > 768) {
                inputRef.current?.focus();
            }
        }
    };

    const handleClearChat = () => {
        setMessages([]);
        setError(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 min-h-0">
                <div className="max-w-3xl mx-auto w-full space-y-4 pb-4">
                    <AnimatePresence initial={false}>
                        {/* Error */}
                        {error && (
                            error.startsWith('limit_reached:') ? (
                                <div className="mb-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-5 relative overflow-hidden animate-in zoom-in-95 shadow-sm">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                                    <div className="flex flex-col gap-3 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                                                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                                Premium Feature Limit
                                            </h4>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                                            {error.replace('limit_reached:', '')}
                                        </p>
                                        <Button
                                            size="sm"
                                            onClick={() => openPricing()}
                                            className="w-full h-10 mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-blue-500/25 transition-all"
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Upgrade for Unlimited Access
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-sm animate-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <div>
                                        {error}
                                        {error.includes('Upgrade') && (
                                            <button
                                                onClick={() => openPricing()}
                                                className="ml-2 text-blue-400 hover:text-blue-300 underline text-xs"
                                            >
                                                View Pro Plans
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        )}

                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/10">
                                    <Bot className="w-8 h-8 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chat with Your AI Coach</h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
                                    Ask me anything about your training, nutrition, recovery, or form. I have access to your workout history and profile.
                                </p>

                                <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                                    {QUICK_PROMPTS.map((prompt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSend(prompt)}
                                            className="text-xs text-left px-3 py-2.5 bg-slate-100 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-zinc-700 transition-all"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Message List */
                            <>
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                    >
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <Bot className="w-4 h-4 text-violet-400" />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-md'
                                                    : 'bg-slate-100 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-bl-md'
                                                }`}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <div className="prose dark:prose-invert max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-slate-900 dark:prose-strong:text-white">
                                                    <ReactMarkdown>{msg.content || (msg.isStreaming ? '...' : '')}</ReactMarkdown>
                                                    {msg.isStreaming && msg.content && (
                                                        <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 rounded-sm" />
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-base whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                        </div>

                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                                <User className="w-4 h-4 text-blue-400" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-none px-4 pb-4 pt-2">
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
                    {!isPremium && usageData && usageData.remaining <= 0 ? (
                        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 text-center animate-in fade-in zoom-in-95">
                            <Sparkles className="w-6 h-6 text-violet-500 mx-auto mb-2" />
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">Out of AI Credits</h3>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
                                You've used all 5 of your free monthly messages. Upgrade to Pro for unlimited chats.
                            </p>
                            <Button onClick={() => openPricing()} className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25">
                                Upgrade to Pro
                            </Button>
                        </div>
                    ) : (
                        <>
                            {!isPremium && !subLoading && (
                                <div className="text-[11px] text-slate-500 dark:text-zinc-500 flex items-center justify-between w-full px-2">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3 text-violet-500" />
                                        {usageData ? (
                                            <span>
                                                <strong className={usageData.remaining > 0 ? "text-slate-700 dark:text-zinc-300 font-semibold" : "text-red-500 font-semibold"}>{usageData.remaining}</strong>/5 messages remaining
                                            </span>
                                        ) : (
                                            <span>Free tier: 5 messages/month</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => openPricing()}
                                        className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                                    >
                                        Upgrade
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2 items-end">
                                {messages.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleClearChat}
                                        className="h-12 w-12 shrink-0 text-slate-400 dark:text-zinc-500 hover:text-red-400 rounded-full"
                                        title="Clear chat"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                )}

                                <div className="flex-1 relative bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/50 rounded-[24px] focus-within:border-slate-300 dark:focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-slate-300 dark:focus-within:ring-zinc-500 transition-all shadow-sm">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Ask your AI coach..."
                                        rows={1}
                                        className="block w-full min-h-[44px] max-h-[200px] bg-transparent border-0 outline-none focus:outline-none focus:ring-0 pl-4 pr-12 py-3 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 resize-none custom-scrollbar rounded-[24px]"
                                        style={{ height: 'auto' }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                    />
                                    <div className="absolute right-2 bottom-1.5 shrink-0 flex items-center justify-center">
                                        <button
                                            onMouseDown={(e) => {
                                                e.preventDefault(); // Prevents input blur on Desktop
                                                if (input.trim() && !isStreaming) handleSend();
                                            }}
                                            onTouchStart={(e) => {
                                                e.preventDefault(); // Prevents input blur on Mobile touch
                                                if (input.trim() && !isStreaming) handleSend();
                                            }}
                                            onClick={(e) => e.preventDefault()}
                                            disabled={!input.trim() || isStreaming}
                                            className="h-8 w-8 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isStreaming ? (
                                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4 text-white -ml-0.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
