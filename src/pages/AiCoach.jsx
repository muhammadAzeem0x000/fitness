import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Loader2, FileText, AlertCircle, Calendar, LineChart, TrendingUp, ArrowLeft, MessageSquare, WifiOff, Sparkles } from 'lucide-react';
import { AiChat } from '../components/ai/AiChat';
import { generateHealthReport } from '../lib/openai';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';
import { useWeight } from '../hooks/useWeight';
import { useWorkouts } from '../hooks/useWorkouts';
import { useProfile } from '../hooks/useProfile';
import { useNutrition } from '../hooks/useNutrition';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SAMPLE_WEEKLY_REPORT, SAMPLE_MONTHLY_REPORT } from '../lib/sampleReports';
import { AiReportModal } from '../components/ai/AiReportModal';
import remarkGfm from 'remark-gfm';
import { useSubscription } from '../hooks/useSubscription';
import { usePricing } from '../context/PricingContext';
import { checkFeatureUsage, incrementFeatureUsage } from '../lib/featureUsage';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBackInterceptor } from '../hooks/useHardwareBackButton';
import { useNetwork } from '../hooks/useNetwork';
export function AiCoach() {
    const { user } = useAuth();
    const { weightHistory } = useWeight(user?.id);
    const { workoutLogs } = useWorkouts(user?.id);
    const { allNutrition } = useNutrition(user?.id);
    const { profile } = useProfile(user?.id);
    const queryClient = useQueryClient();
    const { isPremium, isLoading: subLoading } = useSubscription();
    const { openPricing } = usePricing();
    const navigate = useNavigate();
    const location = useLocation();
    const { isOffline } = useNetwork();

    const [selectedReport, setSelectedReport] = useState(null);
    const [activeTab, setActiveTab] = useState('weekly');
    const [coachMode, setCoachMode] = useState('chat'); // 'reports' or 'chat'

    useBackInterceptor(() => {
        if (selectedReport) {
            setSelectedReport(null);
        } else if (coachMode === 'reports') {
            setCoachMode('chat');
        }
    }, coachMode === 'reports' || !!selectedReport);

    // Fetch reports with React Query
    const { data: allReports = [] } = useQuery({
        queryKey: ['aiReports', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('ai_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false
    });

    // Handle incoming push notification navigation
    useEffect(() => {
        if (location.state?.reportId || location.state?.openLatestReport) {
            setCoachMode('reports'); // Switch UI immediately
            
            if (location.state?.reportId) {
                const targetReport = allReports.find(r => String(r.id) === String(location.state.reportId));
                if (targetReport) {
                    if (targetReport.report_type) {
                        setActiveTab(targetReport.report_type);
                    }
                    setSelectedReport(targetReport);
                    navigate(location.pathname, { replace: true, state: {} });
                } else {
                    queryClient.invalidateQueries({ queryKey: ['aiReports', user?.id] });
                }
            } else if (allReports.length > 0) {
                // Fallback for older payload (no reportId)
                // Ensure we fetch latest so we don't open a stale report
                queryClient.invalidateQueries({ queryKey: ['aiReports', user?.id] });
                
                if (allReports[0].report_type) {
                    setActiveTab(allReports[0].report_type);
                }
                setSelectedReport(allReports[0]);
                
                // Only clear state if the report is very recent (less than 1 min old)
                const isRecent = new Date(allReports[0].created_at) > new Date(Date.now() - 60000);
                if (isRecent) {
                    navigate(location.pathname, { replace: true, state: {} });
                }
            }
        }
    }, [location.state, allReports, navigate, location.pathname, queryClient, user?.id]);

    const isInitialMount = useRef(true);


    const tabs = [
        { id: 'weekly', label: 'Weekly Analysis', icon: LineChart },
        { id: 'monthly', label: 'Monthly Transformation', icon: TrendingUp },
    ];

    // Filter reports for current tab
    const historyList = allReports.filter(r => (r.report_type || 'weekly') === activeTab);

    return (
        <div className="flex flex-col h-full p-4 md:px-4 gap-3 md:gap-4 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
            {/* Header (Fixed) */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bot className="h-6 w-6 text-blue-500" />
                        Master AI Coach
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 text-xs md:text-sm mt-0.5">
                        Your personal elite fitness strategist.
                    </p>
                </div>
            </div>

            <>
                {/* Mode Switcher */}
                <div className="flex p-1 bg-slate-100 dark:bg-zinc-900/80 rounded-xl gap-1 border border-slate-300 dark:border-zinc-800 max-w-sm">
                    <button
                        onClick={() => setCoachMode('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            coachMode === 'chat'
                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <MessageSquare className={`w-3.5 h-3.5 md:w-4 md:h-4 ${coachMode === 'chat' ? 'text-violet-400' : ''}`} />
                        Chat
                    </button>
                    <button
                        onClick={() => setCoachMode('reports')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            coachMode === 'reports'
                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <FileText className={`w-3.5 h-3.5 md:w-4 md:h-4 ${coachMode === 'reports' ? 'text-blue-500' : ''}`} />
                        Reports
                    </button>
                </div>

            {/* Chat Mode */}
            {coachMode === 'chat' ? (
                <div className="flex-1 min-h-0 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 relative">
                    {isOffline && (
                        <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <WifiOff className="w-12 h-12 text-red-500/50 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Offline Mode</h3>
                            <p className="text-zinc-400 max-w-sm">
                                AI Coach requires an active internet connection to communicate with the models. Please reconnect to continue your conversation.
                            </p>
                        </div>
                    )}
                    <AiChat />
                </div>
            ) : (
            <>
            {/* Report Tabs (Fixed) */}
            <div className="flex-none flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl gap-1 overflow-x-auto shrink-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSelectedReport(null); // Clear selection only on manual tab click
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${isActive ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800/50'}`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : ''}`} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Main Content Area: List of Reports */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 md:gap-6 relative">
                
                {/* Reports List */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="flex-none p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-sm flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                            Your {activeTab} Reports
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 custom-scrollbar">
                        {historyList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {historyList.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedReport(item)}
                                        className="text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-slate-950 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-900 dark:text-white text-lg">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </div>
                                            <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <div className="text-sm text-slate-500 dark:text-zinc-400">
                                            Generated at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
                                <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center mb-6 shadow-xl border border-slate-300 dark:border-zinc-700">
                                    <Bot className="h-10 w-10 text-slate-500 dark:text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Reports Yet</h3>
                                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed mb-6">
                                    Master AI generates comprehensive strategy reports automatically based on your workouts and nutrition data.
                                </p>
                                
                                {/* Show Sample Button if empty */}
                                <Button 
                                    onClick={() => setSelectedReport({
                                        id: 'sample',
                                        report_type: activeTab,
                                        created_at: new Date().toISOString(),
                                        report_text: activeTab === 'weekly' ? SAMPLE_WEEKLY_REPORT : SAMPLE_MONTHLY_REPORT,
                                        isSample: true
                                    })}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" /> View Sample Report
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Automated Scheduling Info */}
                <div className="flex-none md:w-64 flex flex-col gap-4">
                    {!isPremium && !subLoading ? (
                        <div className="text-sm text-zinc-500 text-center p-5 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            <Bot className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                            <h4 className="font-bold text-white mb-1">Automated Analysis</h4>
                            <p className="mb-4">Weekly and Monthly AI reports are a Pro feature.</p>
                            <button
                                onClick={() => openPricing()}
                                className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-600 dark:text-zinc-400 p-5 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 text-center">
                            <Bot className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                            <p>Next <strong className="text-slate-900 dark:text-white">{activeTab}</strong> report generates automatically in <strong>{activeTab === 'weekly' ? '7' : '30'} days</strong>.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Report Modal overlay */}
            <AiReportModal 
                report={selectedReport} 
                isOpen={!!selectedReport} 
                onClose={() => setSelectedReport(null)} 
            />

            </>
            )}
            </>
        </div>
    );
}
