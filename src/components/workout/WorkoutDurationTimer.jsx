import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

export function WorkoutDurationTimer({ onTimeUpdate }) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds(s => {
                    const newTime = s + 1;
                    if (onTimeUpdate) onTimeUpdate(newTime);
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive, onTimeUpdate]);

    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleReset = () => {
        setSeconds(0);
        setIsActive(true);
    };

    return (
        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2">
            <Timer className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-lg font-semibold text-white min-w-[60px]">
                {formatTime(seconds)}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    type="button"
                >
                    {isActive ? (
                        <Pause className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                        <Play className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                </button>
                <button
                    onClick={handleReset}
                    className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                    type="button"
                >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                </button>
            </div>
        </div>
    );
}
