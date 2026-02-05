import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { Button } from '../ui/Button';

export function RestTimer({ defaultDuration = 90, onComplete }) {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(defaultDuration);
    const [isMinimized, setIsMinimized] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsActive(false);
                        if (onComplete) onComplete();
                        // Play notification sound (browser API)
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0RVqzn77BZGAk+ltryxnksBSV9zPLaizsIGGS57OihUhELTKXh8bllHAU2jdXzzn0vBSh+zfDajTwIF2m98Oaocx0HOpHX8tB+LgUngc/y2Ik6BxlqvO7mnlIRC0yl4fG5ZRwFNo3V887+LwUofc3w2o08CBdpvfDoqHMdBzqR1/LQfi4FJ4HP8tiJOgcZarzu5p5SE==');
                            audio.play();
                        } catch (e) {
                            console.log('Audio play failed');
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        return () => clearInterval(intervalRef.current);
    }, [isActive, timeLeft, onComplete]);

    const handleStart = () => {
        setIsActive(true);
        setIsMinimized(false);
    };

    const handlePause = () => {
        setIsActive(false);
    };

    const handleReset = () => {
        setIsActive(false);
        setTimeLeft(defaultDuration);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((defaultDuration - timeLeft) / defaultDuration) * 100;

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all animate-in slide-in-from-bottom-4"
            >
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                {isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 border-2 border-zinc-700 rounded-xl shadow-2xl p-4 w-72 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Rest Timer</h4>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-1 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Circular Progress */}
            <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-zinc-800"
                    />
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                        className={`transition-all duration-1000 ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'
                            }`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`font-mono text-3xl font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-white'
                        }`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
                {!isActive ? (
                    <Button
                        onClick={handleStart}
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                        <Play className="w-4 h-4 mr-1" />
                        {timeLeft === defaultDuration ? 'Start' : 'Resume'}
                    </Button>
                ) : (
                    <Button
                        onClick={handlePause}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                    >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                    </Button>
                )}
                <Button
                    onClick={handleReset}
                    size="sm"
                    variant="ghost"
                    className="px-3"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>

            {timeLeft === 0 && (
                <div className="mt-3 text-center">
                    <p className="text-green-500 text-sm font-medium animate-pulse">
                        ✓ Rest complete! Ready for next set
                    </p>
                </div>
            )}
        </div>
    );
}
