import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Loader2, FileText, AlertCircle, Calendar, LineChart, TrendingUp, ArrowLeft, MessageSquare, WifiOff } from 'lucide-react';
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
import { ReportSummaryCards } from '../components/ai/ReportSummaryCards';
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
    const [showHistoryMobile, setShowHistoryMobile] = useState(true);

    useBackInterceptor(() => {
        if (coachMode === 'reports') {
            if (!showHistoryMobile) {
                setShowHistoryMobile(true);
                setSelectedReport(null);
            } else {
                setCoachMode('chat');
            }
        }
    }, coachMode === 'reports');

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
                    setShowHistoryMobile(false);
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
                
                setShowHistoryMobile(false);
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

    // Auto-switch to report view on mobile when report selected or generated
    useEffect(() => {
        if (selectedReport) {
            setShowHistoryMobile(false);
        }
    }, [selectedReport]);


    const tabs = [
        { id: 'weekly', label: 'Weekly Analysis', icon: LineChart },
        { id: 'monthly', label: 'Monthly Transformation', icon: TrendingUp },
    ];

    // Filter reports for current tab
    const historyList = allReports.filter(r => (r.report_type || 'weekly') === activeTab);

    return (
        <div className="flex flex-col h-full p-4 md:px-4 gap-4 md:gap-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
            {/* Header (Fixed) */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-500" />
                        Master AI Coach
                    </h1>
                    <p className="text-slate-500 dark:text-zinc-400 text-sm md:text-base mt-1">
                        Your personal elite fitness strategist.
                    </p>
                </div>
                {/* Mode Switcher */}
                <div className="flex p-1 bg-slate-100 dark:bg-zinc-900/80 rounded-xl gap-1 border border-slate-300 dark:border-zinc-800">
                    <button
                        onClick={() => setCoachMode('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                            coachMode === 'chat'
                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <MessageSquare className={`w-4 h-4 ${coachMode === 'chat' ? 'text-violet-400' : ''}`} />
                        Chat
                    </button>
                    <button
                        onClick={() => setCoachMode('reports')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                            coachMode === 'reports'
                                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <FileText className={`w-4 h-4 ${coachMode === 'reports' ? 'text-blue-500' : ''}`} />
                        Reports
                    </button>
                </div>
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
                                setShowHistoryMobile(true); // Go back to list on tab change
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

            {/* Main Content Area (Scrollable Panels) */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 relative">
                {/* Sidebar: History List (Visible if showHistoryMobile is true OR on Desktop) */}
                <div className={`${showHistoryMobile ? 'flex' : 'hidden'} md:flex md:col-span-1 flex-col h-full min-h-0 gap-4`}>

                    <div className="flex-1 min-h-0 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                        <div className="flex-none p-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-900/80 backdrop-blur-sm">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Past Reports</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {historyList.length > 0 ? (
                                historyList.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSelectedReport(item);
                                            setShowHistoryMobile(false);
                                        }}
                                        className={`w-full text-left p-3 rounded-lg text-sm transition-all border ${selectedReport?.id === item.id
                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-200 shadow-sm'
                                            : 'border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-200'
                                            }`}
                                    >
                                        <div className="font-medium truncate">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs opacity-60 mt-0.5">
                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-xs text-zinc-600 flex flex-col items-center gap-2">
                                    <FileText className="w-8 h-8 opacity-20" />
                                    No {activeTab} reports yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Free tier usage indicator */}
                    {/* Automated Scheduling Info */}
                    {!isPremium && !subLoading ? (
                        <div className="flex-none text-xs text-zinc-500 text-center p-3 bg-zinc-900/50 rounded-xl border border-zinc-800">
                            Automated AI reports are a Pro feature.
                            <button
                                onClick={() => openPricing()}
                                className="block w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors shadow-sm"
                            >
                                Upgrade for Automatic Reports
                            </button>
                        </div>
                    ) : (
                        <div className="flex-none text-xs text-slate-500 dark:text-zinc-400 text-center p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-center gap-2">
                            <Bot className="w-4 h-4 text-blue-500" />
                            Next {activeTab} report generates automatically in {activeTab === 'weekly' ? '7' : '30'} days.
                        </div>
                    )}
                </div>

                <div className={`${!showHistoryMobile ? 'flex' : 'hidden'} md:flex md:col-span-3 flex-col h-full min-h-0 space-y-4`}>

                    {selectedReport ? (
                        <Card className="flex-1 flex flex-col min-h-0 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-900/10 bg-white dark:bg-slate-950">
                            <CardHeader className="flex-none border-b border-slate-200 dark:border-zinc-800/50 bg-blue-500/5 py-4">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    {/* Mobile Back Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2 mr-1 h-8 w-8 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                        onClick={() => setShowHistoryMobile(true)}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>

                                    <FileText className="h-5 w-5 text-blue-400 hidden md:block" />
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="text-xs font-normal text-slate-600 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-900/80 px-2 py-1 rounded border border-slate-300 dark:border-zinc-800">
                                            {new Date(selectedReport.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar prose dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-blue-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-700 dark:prose-li:text-zinc-300">
                                <ReactMarkdown>{selectedReport.report_text}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    ) : historyList.length === 0 ? (
                        // Show sample report for new users
                        <Card className="flex-1 flex flex-col min-h-0 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-900/10 bg-white dark:bg-slate-950">
                            <CardHeader className="flex-none border-b border-slate-200 dark:border-zinc-800/50 bg-blue-500/5 py-4">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    {/* Mobile Back Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2 mr-1 h-8 w-8 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                                        onClick={() => setShowHistoryMobile(true)}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>

                                    <FileText className="h-5 w-5 text-blue-400 hidden md:block" />
                                    Sample {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report
                                    <span className="ml-auto px-2.5 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-md">
                                        Preview
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar prose dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-blue-100 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-slate-900 dark:prose-strong:text-white prose-li:text-slate-700 dark:prose-li:text-zinc-300">
                                <ReactMarkdown>
                                    {activeTab === 'weekly' ? SAMPLE_WEEKLY_REPORT : SAMPLE_MONTHLY_REPORT}
                                </ReactMarkdown>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-zinc-800/50 rounded-xl bg-slate-50 dark:bg-zinc-900/20 text-center">
                            {/* Mobile Back Button State for Empty */}
                            <Button
                                variant="ghost"
                                className="md:hidden absolute top-4 left-4 text-slate-500 dark:text-zinc-400"
                                onClick={() => setShowHistoryMobile(true)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>

                            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-zinc-900 flex items-center justify-center mb-6 shadow-xl border border-slate-300 dark:border-zinc-800">
                                <Bot className="h-10 w-10 text-slate-500 dark:text-zinc-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Analyze</h3>
                            <p className="text-slate-500 dark:text-zinc-500 max-w-md mx-auto leading-relaxed">
                                Select a report type from the tabs above and click "New Report" to generate AI insights, or view past analysis from the sidebar.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            </>
            )}
        </div>
    );
}
