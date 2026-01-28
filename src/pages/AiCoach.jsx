import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Loader2, FileText, AlertCircle, Calendar, LineChart, TrendingUp } from 'lucide-react';
import { generateHealthReport } from '../lib/openai';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import { useFitnessData } from '../hooks/useFitnessData';

export function AiCoach({ weightHistory, workoutLogs, user }) {

    const { profile } = useFitnessData();
    const [loading, setLoading] = useState(false);
    const [allReports, setAllReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('weekly');

    // Fetch all reports on mount
    useEffect(() => {
        if (user) {
            fetchAllReports();
        }
    }, [user]);

    // When tab changes, reset selection to latest of that type? 
    // Or just filter the list. Let's auto-select the latest of that type if available.
    useEffect(() => {
        const typeReports = allReports.filter(r => (r.report_type || 'weekly') === activeTab);
        if (typeReports.length > 0) {
            setSelectedReport(typeReports[0]);
        } else {
            setSelectedReport(null);
        }
    }, [activeTab, allReports]);

    const fetchAllReports = async () => {
        const { data, error } = await supabase
            .from('ai_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setAllReports(data);
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            // Find previous report of SAME type for context
            const previousReport = allReports.find(r => (r.report_type || 'weekly') === activeTab);

            // Pass activeTab as reportType
            const reportText = await generateHealthReport(weightHistory, workoutLogs, previousReport, activeTab, {
                displayName: profile?.display_name,
                workoutDays: profile?.workout_days
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

            // Add to local state
            setAllReports(prev => [data, ...prev]);
            setSelectedReport(data);
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
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-500" />
                        Master AI Coach
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Your personal elite fitness strategist.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-zinc-900 rounded-xl gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${isActive ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : ''}`} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar: History List */}
                <div className="space-y-4">
                    <Button
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                        {loading ? 'Analyzing...' : `New ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`}
                    </Button>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col max-h-[500px]">
                        <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
                            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Past Reports</h3>
                        </div>
                        <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {historyList.length > 0 ? (
                                historyList.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setSelectedReport(item)}
                                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors border ${selectedReport?.id === item.id
                                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                                            : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                            }`}
                                    >
                                        <div className="font-medium">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs opacity-60 mt-0.5">
                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-xs text-zinc-600">
                                    No {activeTab} reports yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content: Report View */}
                <div className="md:col-span-3 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </div>
                    )}

                    {selectedReport ? (
                        <Card className="border-blue-500/30 h-full">
                            <CardHeader className="border-b border-zinc-800/50 bg-blue-500/5">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Analysis
                                    <span className="text-xs font-normal text-zinc-500 ml-auto bg-zinc-900/50 px-2 py-1 rounded">
                                        {new Date(selectedReport.created_at).toLocaleString()}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6 prose prose-invert max-w-none">
                                <ReactMarkdown>{selectedReport.report_text}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-xl h-full bg-zinc-900/20">
                            <Bot className="h-12 w-12 text-zinc-600 mb-4" />
                            <h3 className="text-lg font-medium text-zinc-400">Ready to Analyze</h3>
                            <p className="text-zinc-500 max-w-sm text-center mt-2 px-4">
                                Generate a new {activeTab} report or select a past one from the history list.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
