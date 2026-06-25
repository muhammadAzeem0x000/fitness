import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { History, ChevronRight, Calendar, Dumbbell, Loader2, X } from 'lucide-react';
import { WorkoutDetailsDialog } from './WorkoutDetailsDialog';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useAuth } from '../../hooks/useAuth';

export function WorkoutHistoryList({ workouts }) {
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [displayedCount, setDisplayedCount] = useState(6);
    const scrollContainerRef = useRef(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const { user } = useAuth();
    const { deleteWorkoutLog } = useWorkouts(user?.id);

    // Filter out empty workouts if any
    const validWorkouts = workouts?.filter(w => w.exercises && Object.keys(w.exercises).length > 0) || [];

    // Derived state for what to show
    const visibleWorkouts = validWorkouts.slice(0, displayedCount);
    const hasMore = displayedCount < validWorkouts.length;

    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
            // Check if near bottom
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                if (hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    // Simulate network delay for effect (or just for smoother feel)
                    setTimeout(() => {
                        setDisplayedCount(prev => prev + 6);
                        setIsLoadingMore(false);
                    }, 500);
                }
            }
        }
    };

    return (
        <>
            <Card className="h-full flex flex-col max-h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between pb-4 flex-none border-b border-slate-200 dark:border-zinc-800/50">
                    <CardTitle className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                        Recent History ({validWorkouts.length})
                    </CardTitle>
                    <History className="h-4 w-4 text-blue-500" />
                </CardHeader>

                <CardContent className="p-0 flex-1 overflow-y-auto custom-scrollbar relative"
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                >
                    <div className="divide-y divide-slate-200 dark:divide-zinc-800/50">
                        {validWorkouts.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 dark:text-zinc-500 text-sm">
                                No workouts logged yet.
                            </div>
                        ) : (
                            visibleWorkouts.map((workout) => (
                                <button
                                    key={workout.id}
                                    onClick={() => setSelectedWorkout(workout)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <Dumbbell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-sm">
                                                {workout.type}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-400">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(workout.date).toLocaleDateString(undefined, {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                                <span>•</span>
                                                <span>{Object.keys(workout.exercises).length} Exercises</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Are you sure you want to permanently delete this workout?')) {
                                                    deleteWorkoutLog(workout.id);
                                                }
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-full transition-colors z-10"
                                            title="Delete workout"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-600 group-hover:text-slate-600 dark:group-hover:text-zinc-300 transition-colors" />
                                    </div>
                                </button>
                            ))
                        )}

                        {/* Loading Indicator */}
                        {isLoadingMore && (
                            <div className="p-4 flex justify-center items-center text-slate-500 dark:text-zinc-500 text-xs gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" /> Loading more...
                            </div>
                        )}

                        {!hasMore && validWorkouts.length > 6 && (
                            <div className="p-3 text-center text-xs text-slate-400 dark:text-zinc-600">
                                End of history
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <WorkoutDetailsDialog
                isOpen={!!selectedWorkout}
                onClose={() => setSelectedWorkout(null)}
                workout={selectedWorkout}
            />
        </>
    );
}
