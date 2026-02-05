import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Loader2, FileText, AlertCircle, Calendar, LineChart, TrendingUp, ArrowLeft } from 'lucide-react';
import { generateHealthReport } from '../lib/openai';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../hooks/useAuth';
import { useWeight } from '../hooks/useWeight';
import { useWorkouts } from '../hooks/useWorkouts';
import { useProfile } from '../hooks/useProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SAMPLE_DAILY_REPORT, SAMPLE_WEEKLY_REPORT, SAMPLE_MONTHLY_REPORT } from '../lib/sampleReports';
import { ReportSummaryCards } from '../components/ai/ReportSummaryCards';

export function AiCoach() {
    const { user } = useAuth();
    const { weightHistory } = useWeight(user?.id);
    const { workoutLogs } = useWorkouts(user?.id);
    const { profile } = useProfile(user?.id);
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false); // Keep for generation state
    const [selectedReport, setSelectedReport] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('weekly');

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

    // Auto-select latest report when tab changes or data loads
    useEffect(() => {
        const typeReports = allReports.filter(r => (r.report_type || 'weekly') === activeTab);
        if (typeReports.length > 0) {
            // Only select if nothing is selected or if the selected one is not of the current type
            // Actually, simplified behavior: Always top one for now when tab changes is good default.
            // But we might want to keep selection if switching tabs back and forth? 
            // The user request implies "focused and displayed previously", which usually means "show me the latest".
            setSelectedReport(typeReports[0]);
        } else {
            setSelectedReport(null);
        }
    }, [activeTab, allReports]);

    const [showHistoryMobile, setShowHistoryMobile] = useState(true);

    // Auto-switch to report view on mobile when report selected or generated
    useEffect(() => {
        if (selectedReport) {
            setShowHistoryMobile(false);
        }
    }, [selectedReport]);

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            // Find previous report of SAME type for context
            const previousReport = allReports.find(r => (r.report_type || 'weekly') === activeTab);

            // Get latest weight for fresh accounts
            const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;

            // Pass activeTab as reportType with complete profile data
            const reportText = await generateHealthReport(weightHistory, workoutLogs, previousReport, activeTab, {
                displayName: profile?.display_name,
                workoutDays: profile?.workout_days,
                height: profile?.height,
                currentWeight: latestWeight || profile?.current_weight,
                targetWeight: profile?.target_weight
            });

            // Save to DB
            const { data, error: dbError } = await supabase
                .from('ai_reports')
                .insert({
                    user_id: user.id,
                    report_text: reportText,
                    report_type: activeTab,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Invalidate cache
            queryClient.invalidateQueries(['aiReports', user.id]);

            // Set selection directly (instant feedback)
            setSelectedReport(data);
            setShowHistoryMobile(false); // Switch to view
        } catch (err) {
            console.error(err);
            const msg = err.message || "Unknown error";
            setError(`Failed to generate report: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'daily', label: 'Daily Check-in', icon: Calendar },
        { id: 'weekly', label: 'Weekly Analysis', icon: LineChart },
        { id: 'monthly', label: 'Monthly Transformation', icon: TrendingUp },
    ];

    // Filter reports for current tab
    const historyList = allReports.filter(r => (r.report_type || 'weekly') === activeTab);

    return (
        <div className="flex flex-col h-full p-4 md:p-6 gap-4 md:gap-6 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
            {/* Header (Fixed) */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-500" />
                        Master AI Coach
                    </h1>
                    <p className="text-zinc-400 text-sm md:text-base mt-1">
                        Your personal elite fitness strategist.
                    </p>
                </div>
            </div>

            {/* Tabs (Fixed) */}
            <div className="flex-none flex p-1 bg-zinc-900 rounded-xl gap-1 overflow-x-auto shrink-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setShowHistoryMobile(true); // Go back to list on tab change
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${isActive ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
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
                    <Button
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="flex-none w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        {loading ? 'Analyzing...' : `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`}
                    </Button>

                    <div className="flex-1 min-h-0 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                        <div className="flex-none p-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Past Reports</h3>
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
                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-200 shadow-sm'
                                            : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
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
                </div>

                {/* Right Panel: Report View (Visible if showHistoryMobile is false OR on Desktop) */}
                <div className={`${!showHistoryMobile ? 'flex' : 'hidden'} md:flex md:col-span-3 flex-col h-full min-h-0 space-y-4`}>
                    {error && (
                        <div className="flex-none bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {selectedReport ? (
                        <Card className="flex-1 flex flex-col min-h-0 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-900/10 bg-slate-950">
                            <CardHeader className="flex-none border-b border-zinc-800/50 bg-blue-500/5 py-4">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    {/* Mobile Back Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2 mr-1 h-8 w-8 text-zinc-400"
                                        onClick={() => setShowHistoryMobile(true)}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>

                                    <FileText className="h-5 w-5 text-blue-400 hidden md:block" />
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="text-xs font-normal text-zinc-500 bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800">
                                            {new Date(selectedReport.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar prose prose-invert max-w-none prose-headings:text-blue-100 prose-a:text-blue-400 prose-strong:text-white prose-li:text-zinc-300">
                                <ReactMarkdown>{selectedReport.report_text}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    ) : historyList.length === 0 ? (
                        // Show sample report for new users
                        <Card className="flex-1 flex flex-col min-h-0 border-blue-500/30 overflow-hidden shadow-2xl shadow-blue-900/10 bg-slate-950">
                            <CardHeader className="flex-none border-b border-zinc-800/50 bg-blue-500/5 py-4">
                                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                                    {/* Mobile Back Button */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden -ml-2 mr-1 h-8 w-8 text-zinc-400"
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
                            <CardContent className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar prose prose-invert max-w-none prose-headings:text-blue-100 prose-a:text-blue-400 prose-strong:text-white prose-li:text-zinc-300">
                                <ReactMarkdown>
                                    {activeTab === 'daily' ? SAMPLE_DAILY_REPORT :
                                        activeTab === 'weekly' ? SAMPLE_WEEKLY_REPORT :
                                            SAMPLE_MONTHLY_REPORT}
                                </ReactMarkdown>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/20 text-center">
                            {/* Mobile Back Button State for Empty */}
                            <Button
                                variant="ghost"
                                className="md:hidden absolute top-4 left-4 text-zinc-400"
                                onClick={() => setShowHistoryMobile(true)}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>

                            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center mb-6 shadow-xl border border-zinc-800">
                                <Bot className="h-10 w-10 text-zinc-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Ready to Analyze</h3>
                            <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                                Select a report type from the tabs above and click "New Report" to generate AI insights, or view past analysis from the sidebar.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
