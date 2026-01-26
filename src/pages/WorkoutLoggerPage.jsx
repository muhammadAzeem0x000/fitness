import React from 'react';
import { WorkoutLogger } from '../components/workout/WorkoutLogger';

export function WorkoutLoggerPage({ addWorkoutLog, workoutLogs }) {
    return (
        <div className="animate-in fade-in duration-500">
            <WorkoutLogger onSaveLog={addWorkoutLog} history={workoutLogs} />
        </div>
    );
}
