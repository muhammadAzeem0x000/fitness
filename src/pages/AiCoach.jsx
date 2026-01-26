import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Bot, Loader2, FileText, AlertCircle } from 'lucide-react';
import { generateHealthReport } from '../lib/openai';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown'; // Assuming we might add this later, but for now rendering simple text

export function AiCoach({ weightHistory, workoutLogs, user }) {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [error, setError] = useState(null);

    // Fetch latest report on mount
    useEffect(() => {
        if (user) {
            fetchLatestReport();
        }
    }, [user]);

    const fetchLatestReport = async () => {
        const { data, error } = await supabase
            .from('ai_reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setReport(data);
        }
    };

    const handleGenerateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const reportText = await generateHealthReport(weightHistory, workoutLogs, report);

            // Save to DB
            const { data, error: dbError } = await supabase
                .from('ai_reports')
                .insert({
                    user_id: user.id,
                    report_text: reportText,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (dbError) throw dbError;

            setReport(data);
        } catch (err) {
            console.error(err);
            const msg = err.message || "Unknown error";
            setError(`Failed to generate report: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper to render markdown removed in favor of react-markdown

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                        <Bot className="h-8 w-8 text-blue-500" />
                        Master AI Coach
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Your personal elite fitness strategist.
                    </p>
                </div>
                <Button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    {loading ? 'Analyzing...' : 'Generate Analysis'}
                </Button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {report ? (
                    <Card className="border-blue-500/30">
                        <CardHeader className="border-b border-zinc-800/50 bg-blue-500/5">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-400" />
                                Latest Strategy Report
                                <span className="text-xs font-normal text-zinc-500 ml-auto">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 prose prose-invert max-w-none">
                            <ReactMarkdown>{report.report_text}</ReactMarkdown>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl">
                        <Bot className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-400">No Reports Yet</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto mt-2">
                            Click "Generate Analysis" to have the AI analyze your recent data and build a strategy.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
