import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { History, ChevronRight, Calendar, Dumbbell } from 'lucide-react';
import { WorkoutDetailsDialog } from './WorkoutDetailsDialog';

export function WorkoutHistoryList({ workouts }) {
    const [selectedWorkout, setSelectedWorkout] = useState(null);

    // Filter out empty workouts if any
    const validWorkouts = workouts?.filter(w => w.exercises && Object.keys(w.exercises).length > 0) || [];

    return (
        <>
            <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">
                        Recent History
                    </CardTitle>
                    <History className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-800/50">
                        {validWorkouts.length === 0 ? (
                            <div className="p-6 text-center text-zinc-500 text-sm">
                                No workouts logged yet.
                            </div>
                        ) : (
                            validWorkouts.slice(0, 5).map((workout) => (
                                <button
                                    key={workout.id}
                                    onClick={() => setSelectedWorkout(workout)}
                                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <Dumbbell className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-zinc-200 group-hover:text-white transition-colors text-sm">
                                                {workout.type}
                                            </h4>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 group-hover:text-zinc-400">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(workout.date).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                                <span>•</span>
                                                <span>{Object.keys(workout.exercises).length} Exercises</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                                </button>
                            ))
                        )}
                        {validWorkouts.length > 5 && (
                            <div className="p-3 text-center border-t border-zinc-800/50">
                                <span className="text-xs text-zinc-500">Showing last 5 sessions</span>
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
