import React from 'react';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export function ReportSummaryCards({ workouts = [], weightData = [], reportType = 'weekly' }) {
    // Calculate metrics based on report type
    const calculateMetrics = () => {
        const daysToLookBack = reportType === 'monthly' ? 30 : 7;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToLookBack);

        // Filter data for the period
        const recentWorkouts = workouts.filter(w => new Date(w.date) >= cutoffDate);
        const recentWeights = weightData.filter(w => new Date(w.date) >= cutoffDate);

        // Calculate total volume
        let totalVolume = 0;
        recentWorkouts.forEach(workout => {
            const exercises = workout.exercises;
            if (exercises && typeof exercises === 'object') {
                Object.values(exercises).forEach(sets => {
                    if (Array.isArray(sets)) {
                        sets.forEach(set => {
                            const weight = parseFloat(set.weight) || 0;
                            const reps = parseFloat(set.reps) || 0;
                            totalVolume += weight * reps;
                        });
                    }
                });
            }
        });

        // Calculate frequency
        const frequency = recentWorkouts.length;
        const expectedFrequency = reportType === 'monthly' ? 12 : 4;
        const frequencyPercentage = Math.min(100, Math.round((frequency / expectedFrequency) * 100));

        // Calculate weight change
        let weightChange = 0;
        let weightTrend = 'stable';
        if (recentWeights.length >= 2) {
            const firstWeight = recentWeights[0].weight;
            const lastWeight = recentWeights[recentWeights.length - 1].weight;
            weightChange = (lastWeight - firstWeight).toFixed(1);
            weightTrend = weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable';
        }

        // Volume trend (compare to previous period)
        const previousPeriodStart = new Date(cutoffDate);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - daysToLookBack);
        const previousWorkouts = workouts.filter(w => {
            const date = new Date(w.date);
            return date >= previousPeriodStart && date < cutoffDate;
        });

        let previousVolume = 0;
        previousWorkouts.forEach(workout => {
            const exercises = workout.exercises;
            if (exercises && typeof exercises === 'object') {
                Object.values(exercises).forEach(sets => {
                    if (Array.isArray(sets)) {
                        sets.forEach(set => {
                            const weight = parseFloat(set.weight) || 0;
                            const reps = parseFloat(set.reps) || 0;
                            previousVolume += weight * reps;
                        });
                    }
                });
            }
        });

        const volumeChange = previousVolume > 0
            ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100)
            : 0;

        return {
            totalVolume: Math.round(totalVolume),
            volumeChange,
            frequency,
            frequencyPercentage,
            weightChange,
            weightTrend,
        };
    };

    const metrics = calculateMetrics();

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 animate-fade-in">
            {/* Volume Card */}
            <Card className="card-interactive">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Total Volume</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                {metrics.totalVolume.toLocaleString()} kg
                            </h3>
                            <div className="flex items-center gap-1 mt-2">
                                {metrics.volumeChange !== 0 && (
                                    <>
                                        {metrics.volumeChange > 0 ? (
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className={`text-sm font-medium ${metrics.volumeChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {metrics.volumeChange > 0 ? '+' : ''}{metrics.volumeChange}%
                                        </span>
                                    </>
                                )}
                                <span className="text-xs text-slate-400 dark:text-zinc-600">vs last period</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Frequency Card */}
            <Card className="card-interactive">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Frequency</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                {metrics.frequency} workouts
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex-1 h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${metrics.frequencyPercentage >= 75 ? 'bg-green-500' :
                                                metrics.frequencyPercentage >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                            }`}
                                        style={{ width: `${metrics.frequencyPercentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-slate-400 dark:text-zinc-600">{metrics.frequencyPercentage}%</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Weight Change Card */}
            <Card className="card-interactive">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-zinc-500 uppercase tracking-wide font-medium">Weight Change</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                {metrics.weightChange > 0 ? '+' : ''}{metrics.weightChange} kg
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-zinc-600 mt-2">
                                {metrics.weightTrend === 'up' && 'Trending up'}
                                {metrics.weightTrend === 'down' && 'Trending down'}
                                {metrics.weightTrend === 'stable' && 'Holding steady'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                            {metrics.weightTrend === 'up' ? (
                                <TrendingUp className="w-6 h-6 text-orange-400" />
                            ) : metrics.weightTrend === 'down' ? (
                                <TrendingDown className="w-6 h-6 text-orange-400" />
                            ) : (
                                <Activity className="w-6 h-6 text-orange-400" />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
