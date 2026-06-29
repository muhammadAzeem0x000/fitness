import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import ReactMarkdown from 'react-markdown';
import { sendChatMessage } from '../../lib/aiChat';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useWeight } from '../../hooks/useWeight';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useSubscription } from '../../hooks/useSubscription';
import { usePricing } from '../../context/PricingContext';
import { checkFeatureUsage, incrementFeatureUsage } from '../../lib/featureUsage';
import { useNavigate } from 'react-router-dom';

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

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
                    setError(`Free tier limit reached (5 messages/month). Resets on ${resetDate}. Upgrade to Pro for unlimited!`);
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
                } catch (err) {
                    console.warn('Feature usage increment failed:', err);
                }
            }
        } catch (err) {
            console.error('Chat error:', err);
            // Remove the placeholder on error
            setMessages(updatedMessages);
            setError(err.message || 'Failed to get a response');
        } finally {
            setIsStreaming(false);
            inputRef.current?.focus();
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
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4 min-h-0">
                {messages.length === 0 ? (
                    /* Empty State */
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

                        {!isPremium && !subLoading && (
                            <div className="mt-6 text-xs text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-lg px-4 py-2">
                                Free tier: 5 messages/month
                                <button
                                    onClick={() => openPricing()}
                                    className="ml-2 text-violet-400 hover:text-violet-300 underline"
                                >
                                    Upgrade
                                </button>
                            </div>
                        )}
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
                                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-slate-100 dark:bg-zinc-900/80 border border-slate-300 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 rounded-bl-md'
                                    }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-slate-900 dark:prose-strong:text-white">
                                            <ReactMarkdown>{msg.content || (msg.isStreaming ? '...' : '')}</ReactMarkdown>
                                            {msg.isStreaming && msg.content && (
                                                <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 rounded-sm" />
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
            </div>

            {/* Error */}
            {error && (
                <div className="flex-none mx-4 mb-2 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-sm animate-in slide-in-from-bottom-2">
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
            )}

            {/* Input Area */}
            <div className="flex-none px-4 py-3 border-t border-slate-200 dark:border-zinc-800/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                <div className="flex gap-2 items-end">
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClearChat}
                            className="h-11 w-11 shrink-0 text-slate-400 dark:text-zinc-500 hover:text-red-400"
                            title="Clear chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}

                    <div className="flex-1 flex items-end bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-xl focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-all overflow-hidden">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your AI coach..."
                            rows={1}
                            className="block w-full min-h-[44px] max-h-[120px] bg-transparent border-0 pl-4 pr-2 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:ring-0 resize-none custom-scrollbar"
                            style={{ height: 'auto' }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <div className="p-1.5 shrink-0 flex items-center justify-center">
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isStreaming}
                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
            </div>
        </div>
    );
}
