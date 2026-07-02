import React, { useEffect, useState } from 'react';
import { calculateReadiness } from '../../lib/readiness';
import { Moon, Footprints, Flame, Activity, ChevronRight, RefreshCw, Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../hooks/useSubscription';
import { usePricing } from '../../context/PricingContext';

// Simple circular progress ring component
const ProgressRing = ({ radius, stroke, progress, color }) => {
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const [strokeDashoffset, setStrokeDashoffset] = useState(circumference);

    useEffect(() => {
        const offset = circumference - (progress / 100) * circumference;
        // Small timeout to allow the transition to happen after mount
        const timer = setTimeout(() => {
            setStrokeDashoffset(offset);
        }, 100);
        return () => clearTimeout(timer);
    }, [progress, circumference]);

    return (
        <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
        >
            {/* Background ring */}
            <circle
                stroke="currentColor"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="text-slate-100 dark:text-zinc-800"
            />
            {/* Progress ring */}
            <circle
                stroke={color}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
            />
        </svg>
    );
};

export const ReadinessCard = ({ metrics = [], workoutLogs = [], syncNow, isSyncing }) => {
    const navigate = useNavigate();
    const { isPremium } = useSubscription();
    const { openPricing } = usePricing();
    
    // Get today's metrics using local date (not UTC via toISOString)
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayMetrics = metrics.find(m => m.date === today) || {
        sleep_hours: 0,
        steps: 0,
        active_calories: 0
    };

    const { score, status, recommendation } = calculateReadiness({
        sleepHours: todayMetrics.sleep_hours,
        workoutLogs
    });

    // Determine colors based on score
    let colorClass = 'text-green-500';
    let ringColor = '#10B981'; // emerald-500
    let bgGradient = 'from-green-500/10 to-emerald-500/5';
    let glowClass = 'shadow-green-500/20';

    if (score < 40) {
        colorClass = 'text-red-500';
        ringColor = '#EF4444'; // red-500
        bgGradient = 'from-red-500/10 to-rose-500/5';
        glowClass = 'shadow-red-500/20';
    } else if (score < 70) {
        colorClass = 'text-yellow-500';
        ringColor = '#F59E0B'; // amber-500
        bgGradient = 'from-yellow-500/10 to-amber-500/5';
        glowClass = 'shadow-yellow-500/20';
    }

    const isConnected = localStorage.getItem('health_connected') === 'true';

    // If not premium, show a locked state
    if (!isPremium) {
        return (
            <div 
                onClick={() => openPricing()}
                className="relative overflow-hidden cursor-pointer group bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-xl transition-all hover:scale-[1.02]"
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
                
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                                <Activity className="w-4 h-4 text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-200">
                                Daily Readiness
                            </h3>
                        </div>
                        
                        <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                            Unlock Insights <Lock className="w-5 h-5 text-indigo-400" />
                        </h2>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-[220px]">
                            Get a personalized daily score based on your sleep, recovery, and workout volume.
                        </p>

                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                            <Sparkles className="w-3 h-3" />
                            Pro Feature
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => navigate('/analytics')}
            className={`relative overflow-hidden cursor-pointer group bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-lg ${glowClass} transition-all hover:scale-[1.01]`}
        >
            {/* Glassmorphic gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-50`} />
            
            <div className="relative z-10 flex items-center justify-between">
                
                {/* Left Side: Score & Text */}
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className={`w-5 h-5 ${colorClass}`} />
                        <h3 className="text-sm font-bold tracking-wider uppercase text-slate-600 dark:text-zinc-400">
                            Daily Readiness
                        </h3>
                    </div>
                    
                    {!isConnected ? (
                        <>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                Connect Health
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-500">
                                Link Health Connect to get your personalized readiness score.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className={`text-2xl font-black mb-1 ${colorClass}`}>
                                {score} <span className="text-sm font-semibold text-slate-500 dark:text-zinc-500">/ 100</span>
                            </h2>
                            <p className="text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">
                                {status}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-[200px] hidden sm:block mt-1">
                                {todayMetrics.sleep_hours === 0 ? (
                                    <span className="text-amber-600 dark:text-amber-500 flex flex-col gap-0.5">
                                        <span className="font-semibold">⚠️ Sleep data missing</span>
                                        <span className="text-[10px] leading-tight text-amber-600/80 dark:text-amber-500/80">Wearable tracker required for accurate score</span>
                                    </span>
                                ) : (
                                    recommendation
                                )}
                            </p>
                        </>
                    )}
                </div>

                {/* Right Side: Circular Gauge */}
                {isConnected && (
                    <div className="relative flex-shrink-0 flex items-center justify-center">
                        <ProgressRing radius={45} stroke={8} progress={score} color={ringColor} />
                        <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className={`text-xl font-black ${colorClass}`}>{score}%</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Row: Mini Stats */}
            {isConnected && (
                <div className="relative z-10 grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800/50">
                    <div className="flex flex-col items-center justify-center">
                        <Moon className="w-4 h-4 text-indigo-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            {todayMetrics.sleep_hours}h
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center border-l border-r border-slate-100 dark:border-zinc-800/50">
                        <Footprints className="w-4 h-4 text-emerald-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            {todayMetrics.steps.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <Flame className="w-4 h-4 text-orange-400 mb-1" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            {todayMetrics.active_calories} kcal
                        </span>
                    </div>
                </div>
            )}
            
            {/* Expand indicator */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
        </div>
    );
};
