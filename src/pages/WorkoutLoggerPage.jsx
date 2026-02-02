import React from 'react';
import { WorkoutLogger } from '../components/workout/WorkoutLogger';
import { useAuth } from '../hooks/useAuth';
import { useWorkouts } from '../hooks/useWorkouts';
import { useProfile } from '../hooks/useProfile';

export function WorkoutLoggerPage() {
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const { addWorkoutLog, workoutLogs, routines } = useWorkouts(user?.id);

    return (
        <div className="animate-in fade-in duration-500">
            <WorkoutLogger
                onSaveLog={addWorkoutLog}
                history={workoutLogs}
                routines={routines}
                defaultReps={profile?.default_reps || 12}
            />
        </div>
    );
}
