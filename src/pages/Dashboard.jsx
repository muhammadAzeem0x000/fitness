import React, { useState, useEffect } from 'react';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { WeightChart } from '../components/dashboard/WeightChart';
import { VolumeChart } from '../components/dashboard/VolumeChart';
import { WorkoutHistoryList } from '../components/dashboard/WorkoutHistoryList';
import { PersonalRecords } from '../components/dashboard/PersonalRecords';
import { StreakCard } from '../components/dashboard/StreakCard';
import { AiInsightsCard } from '../components/dashboard/AiInsightsCard';
import { WorkoutCalendar } from '../components/dashboard/WorkoutCalendar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonCard, SkeletonChart } from '../components/ui/Skeleton';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWeight } from '../hooks/useWeight';
import { useWorkouts } from '../hooks/useWorkouts';
import { calculateBMI, getUserStats } from '../lib/fitnessUtils';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PremiumGate } from '../components/premium/PremiumGate';

export function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { profile, updateHeight, isLoading: profileLoading } = useProfile(user?.id);
    const { weightHistory, addWeightEntry, isLoading: weightLoading } = useWeight(user?.id);
    const { workoutLogs, isLoading: workoutsLoading } = useWorkouts(user?.id);

    const { convertWeightToDb, formatWeightLabel, displayWeight } = useUserPreferences();
    const [inputValue, setInputValue] = useState('');

    const userStats = getUserStats(profile, weightHistory);
    const currentBMI = calculateBMI(userStats.currentWeight, userStats.height);
    const isLoading = profileLoading || weightLoading || workoutsLoading;

    const handleUpdate = async () => {
        if (!inputValue) return;
        const weightInKg = convertWeightToDb(inputValue);
        await addWeightEntry(weightInKg);
        setInputValue('');
    };

    // Show empty state if no workouts
    const hasWorkouts = workoutLogs && workoutLogs.length > 0;

    return (
        <div className="grid gap-6 animate-in fade-in duration-500">
            <StatsOverview stats={userStats} currentBMI={currentBMI} />

            {/* Smart AI Insights */}
            {!isLoading && (
                <AiInsightsCard
                    workoutLogs={workoutLogs}
                    weightHistory={weightHistory}
                    profile={profile}
                />
            )}

            {/* Streak and PRs Row - PREMIUM */}
            <PremiumGate feature="streak tracking and personal records">
                <div className="grid md:grid-cols-2 gap-6">
                    {isLoading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <>
                            <StreakCard workouts={workoutLogs} workoutDays={profile?.workout_days || []} />
                            <PersonalRecords workouts={workoutLogs} />
                        </>
                    )}
                </div>
            </PremiumGate>

            {/* Charts Row - PREMIUM */}
            <PremiumGate feature="advanced progress charts">
                <div className="grid lg:grid-cols-2 gap-6">
                    {isLoading ? (
                        <>
                            <div className="col-span-full">
                                <SkeletonChart />
                            </div>
                            <SkeletonChart />
                            <SkeletonChart />
                        </>
                    ) : (
                        <>
                            <WeightChart data={weightHistory} />
                            {hasWorkouts && (
                                <>
                                    <VolumeChart workouts={workoutLogs} />
                                    <WorkoutCalendar workouts={workoutLogs} />
                                </>
                            )}
                        </>
                    )}
                </div>

            </PremiumGate>

            {/* Main Content + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {isLoading ? (
                        <SkeletonCard count={3} />
                    ) : !hasWorkouts ? (
                        <EmptyState
                            icon={Dumbbell}
                            title="No Workouts Yet"
                            description="Start tracking your fitness journey by logging your first workout. Click the button below to get started!"
                            actionLabel="Log First Workout"
                            onAction={() => navigate('/log')}
                        />
                    ) : (
                        <WorkoutHistoryList workouts={workoutLogs} />
                    )}
                </div>
            </div>
        </div>
    );
}
