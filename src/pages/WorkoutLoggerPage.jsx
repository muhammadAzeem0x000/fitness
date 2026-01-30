import React from 'react';
import { WorkoutLogger } from '../components/workout/WorkoutLogger';
import { useAuth } from '../hooks/useAuth';
import { useWorkouts } from '../hooks/useWorkouts';

export function WorkoutLoggerPage() {
    const { user } = useAuth();
    const { addWorkoutLog, workoutLogs, routines } = useWorkouts(user?.id);

    return (
        <div className="animate-in fade-in duration-500">
            <WorkoutLogger onSaveLog={addWorkoutLog} history={workoutLogs} routines={routines} />
        </div>
    );
}
