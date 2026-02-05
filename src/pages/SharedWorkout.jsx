import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Trophy, Calendar, Clock, Dumbbell, ArrowLeft, Share2 } from 'lucide-react';

export function SharedWorkout() {
    const { shareId } = useParams();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSharedWorkout();
    }, [shareId]);

    const fetchSharedWorkout = async () => {
        try {
            const { data, error } = await supabase
                .from('shared_workouts')
                .select('*')
                .eq('share_id', shareId)
                .single();

            if (error) throw error;

            if (!data) {
                setError('Workout not found');
                return;
            }

            setWorkout(data);
        } catch (err) {
            console.error('Error fetching shared workout:', err);
            setError('Failed to load workout');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalVolume = () => {
        if (!workout?.exercises) return 0;

        let total = 0;
        Object.values(workout.exercises).forEach(sets => {
            if (Array.isArray(sets)) {
                sets.forEach(set => {
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseFloat(set.reps) || 0;
                    total += weight * reps;
                });
            }
        });
        return Math.round(total);
    };

    const getTotalSets = () => {
        if (!workout?.exercises) return 0;

        let total = 0;
        Object.values(workout.exercises).forEach(sets => {
            if (Array.isArray(sets)) {
                total += sets.length;
            }
        });
        return total;
    };

    const handleCopyLink = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-zinc-400">Loading workout...</p>
                </div>
            </div>
        );
    }

    if (error || !workout) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full bg-zinc-900/50 border-zinc-800">
                    <CardContent className="pt-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <Dumbbell className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Workout Not Found</h2>
                        <p className="text-zinc-400 mb-6">{error || 'This workout may have been deleted or the link is invalid.'}</p>
                        <Button onClick={() => navigate('/')} className="w-full">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalVolume = calculateTotalVolume();
    const totalSets = getTotalSets();
    const exerciseCount = Object.keys(workout.exercises || {}).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                        <Dumbbell className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Shared Workout</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {workout.workout_type} Workout
                    </h1>
                    <p className="text-zinc-400">
                        Shared by <span className="text-blue-400 font-medium">{workout.shared_by_name || 'Anonymous'}</span>
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-zinc-900/50 border-zinc-800 card-interactive">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">Total Volume</p>
                                    <h3 className="text-2xl font-bold text-white">{totalVolume.toLocaleString()} kg</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800 card-interactive">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">Total Sets</p>
                                    <h3 className="text-2xl font-bold text-white">{totalSets}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Dumbbell className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800 card-interactive">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium mb-1">Exercises</p>
                                    <h3 className="text-2xl font-bold text-white">{exerciseCount}</h3>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-orange-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Workout Date */}
                <div className="flex items-center justify-center gap-4 mb-8 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(workout.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-zinc-600"></div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(workout.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                </div>

                {/* Exercises */}
                <div className="grid gap-4 mb-8">
                    {Object.entries(workout.exercises || {}).map(([exerciseName, sets], idx) => {
                        const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0));
                        const totalReps = sets.reduce((sum, s) => sum + (parseFloat(s.reps) || 0), 0);

                        return (
                            <Card key={idx} className="bg-zinc-900/50 border-blue-500/20 border-l-4 animate-fade-in">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-lg font-semibold text-white">{exerciseName}</span>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500">
                                                <Trophy className="w-3 h-3 inline mr-1" />
                                                {maxWeight}kg
                                            </div>
                                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400">
                                                {sets.length} sets
                                            </div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {sets.map((set, setIdx) => (
                                            <div key={setIdx} className="flex items-center gap-4 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                                <span className="text-xs font-mono text-zinc-500 w-12">Set {setIdx + 1}</span>
                                                <div className="flex-1 flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-zinc-400">Weight:</span>
                                                        <span className="text-lg font-bold text-white">{set.weight} kg</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-zinc-700"></div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-zinc-400">Reps:</span>
                                                        <span className="text-lg font-bold text-white">{set.reps}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-zinc-800 text-sm text-zinc-500">
                                        Total reps: {totalReps} • Volume: {sets.reduce((sum, s) => sum + ((parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0)), 0).toLocaleString()} kg
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={handleCopyLink} variant="secondary" className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Copy Link
                    </Button>
                    <Button onClick={() => navigate('/')} className="gap-2">
                        <Dumbbell className="w-4 h-4" />
                        Start Your Own Journey
                    </Button>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-zinc-600 text-sm">
                    <p>Powered by <span className="text-blue-400 font-semibold">SmartFit</span></p>
                    <p className="mt-1">Track your fitness journey with AI-powered insights</p>
                </div>
            </div>
        </div>
    );
}
