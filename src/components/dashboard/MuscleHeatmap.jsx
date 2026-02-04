import React, { useMemo } from 'react';
import { Card, CardContent } from '../ui/Card';

export function MuscleHeatmap({ workouts = [] }) {
    // Filter workouts from last 7 days and count sets per muscle group
    const muscleData = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentWorkouts = workouts.filter(workout => {
            const workoutDate = new Date(workout.date);
            return workoutDate >= sevenDaysAgo;
        });

        // Count sets per muscle group
        const counts = {
            chest: 0,
            back: 0,
            shoulders: 0,
            arms: 0,
            abs: 0,
            legs: 0
        };

        recentWorkouts.forEach(workout => {
            const type = workout.type?.toLowerCase() || '';
            const exercises = workout.exercises || {};

            // Count total sets for this workout
            const totalSets = Object.values(exercises).reduce((sum, sets) => {
                return sum + (Array.isArray(sets) ? sets.length : 0);
            }, 0);

            // Map workout type to muscle group
            if (type.includes('chest') || type.includes('pecs')) {
                counts.chest += totalSets;
            } else if (type.includes('back') || type.includes('lats')) {
                counts.back += totalSets;
            } else if (type.includes('shoulder') || type.includes('delts')) {
                counts.shoulders += totalSets;
            } else if (type.includes('arm') || type.includes('bicep') || type.includes('tricep')) {
                counts.arms += totalSets;
            } else if (type.includes('abs') || type.includes('core')) {
                counts.abs += totalSets;
            } else if (type.includes('leg') || type.includes('quad') || type.includes('hamstring') || type.includes('glute')) {
                counts.legs += totalSets;
            }
        });

        return counts;
    }, [workouts]);

    // Color mapping based on set count
    const getColorForSets = (setCount) => {
        if (setCount === 0) return '#27272a';      // Very dark gray - Inactive
        if (setCount <= 4) return '#3b82f6';       // Blue - Active
        if (setCount <= 9) return '#f59e0b';       // Amber - Productive
        return '#ef4444';                          // Red - Highly Fatigued
    };

    const getLabel = (setCount) => {
        if (setCount === 0) return 'Rested';
        if (setCount <= 4) return 'Active';
        if (setCount <= 9) return 'Productive';
        return 'Fatigued';
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-1">Muscle Activation Map</h3>
                    <p className="text-sm text-zinc-400">7-day training intensity heatmap</p>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-6 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#27272a' }} />
                        <span className="text-zinc-400">Rested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
                        <span className="text-zinc-400">Active (1-4)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="text-zinc-400">Productive (5-9)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
                        <span className="text-zinc-400">Fatigued (10+)</span>
                    </div>
                </div>

                {/* Anatomical Body Diagram - Realistic Style */}
                <div className="flex justify-center">
                    <svg viewBox="0 0 200 450" className="w-full h-auto max-w-[220px]" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                        <defs>
                            {/* Gradient for 3D effect */}
                            <radialGradient id="muscleGradient">
                                <stop offset="30%" stopColor="currentColor" stopOpacity="1" />
                                <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
                            </radialGradient>

                            {/* Skin tone base */}
                            <linearGradient id="skinTone" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3f3f46" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#27272a" stopOpacity="0.5" />
                            </linearGradient>
                        </defs>

                        {/* Body Base Outline - Light gray skeleton */}
                        <g stroke="#52525b" strokeWidth="1" fill="url(#skinTone)" opacity="0.4">
                            {/* Head */}
                            <ellipse cx="100" cy="25" rx="18" ry="22" />
                            {/* Neck */}
                            <path d="M 92 45 L 90 58 L 110 58 L 108 45" />
                            {/* Torso */}
                            <path d="M 70 65 Q 65 90 68 130 L 72 170 L 78 200 L 82 210 L 118 210 L 122 200 L 128 170 L 132 130 Q 135 90 130 65 Z" />
                            {/* Hips */}
                            <ellipse cx="100" cy="215" rx="24" ry="12" />
                        </g>

                        {/* SHOULDERS (Deltoids) - Realistic rounded caps */}
                        <g className="muscle-group cursor-pointer transition-opacity hover:opacity-90">
                            <title>Shoulders: {muscleData.shoulders} sets - {getLabel(muscleData.shoulders)}</title>
                            {/* Left Deltoid - Three heads visible */}
                            <path
                                d="M 70 65 Q 55 70 48 85 Q 45 95 52 105 Q 58 110 68 108 Q 72 100 70 90 Z"
                                fill={getColorForSets(muscleData.shoulders)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Right Deltoid */}
                            <path
                                d="M 130 65 Q 145 70 152 85 Q 155 95 148 105 Q 142 110 132 108 Q 128 100 130 90 Z"
                                fill={getColorForSets(muscleData.shoulders)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Muscle striations */}
                            <path d="M 58 80 Q 62 85 60 90" stroke="#000" strokeWidth="0.5" opacity="0.3" />
                            <path d="M 142 80 Q 138 85 140 90" stroke="#000" strokeWidth="0.5" opacity="0.3" />
                        </g>

                        {/* CHEST (Pectorals) - Detailed pec shape */}
                        <g className="muscle-group cursor-pointer transition-opacity hover:opacity-90">
                            <title>Chest: {muscleData.chest} sets - {getLabel(muscleData.chest)}</title>
                            {/* Left Pec - Anatomically accurate fan shape */}
                            <path
                                d="M 100 68 Q 85 72 75 82 Q 70 88 68 98 Q 68 108 72 118 Q 78 128 88 132 Q 95 134 100 130 L 100 68"
                                fill={getColorForSets(muscleData.chest)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Right Pec */}
                            <path
                                d="M 100 68 Q 115 72 125 82 Q 130 88 132 98 Q 132 108 128 118 Q 122 128 112 132 Q 105 134 100 130 L 100 68"
                                fill={getColorForSets(muscleData.chest)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Pec striations */}
                            <path d="M 100 68 L 100 130" stroke="#000" strokeWidth="1" opacity="0.2" />
                            <path d="M 85 95 Q 95 98 100 95" stroke="#000" strokeWidth="0.8" opacity="0.2" />
                            <path d="M 115 95 Q 105 98 100 95" stroke="#000" strokeWidth="0.8" opacity="0.2" />
                        </g>

                        {/* ARMS - Combined biceps/triceps with realistic shape */}
                        <g className="muscle-group cursor-pointer transition-opacity hover:opacity-90">
                            <title>Arms: {muscleData.arms} sets - {getLabel(muscleData.arms)}</title>
                            {/* Left Upper Arm (Bicep peek) */}
                            <ellipse
                                cx="52" cy="115" rx="14" ry="32"
                                fill={getColorForSets(muscleData.arms)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Left Forearm */}
                            <path
                                d="M 52 148 Q 48 165 50 182 Q 52 190 58 192 Q 62 188 60 175 Q 58 160 56 148 Z"
                                fill={getColorForSets(muscleData.arms)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Right Upper Arm */}
                            <ellipse
                                cx="148" cy="115" rx="14" ry="32"
                                fill={getColorForSets(muscleData.arms)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Right Forearm */}
                            <path
                                d="M 148 148 Q 152 165 150 182 Q 148 190 142 192 Q 138 188 140 175 Q 142 160 144 148 Z"
                                fill={getColorForSets(muscleData.arms)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Bicep peaks */}
                            <path d="M 52 105 L 52 125" stroke="#000" strokeWidth="1" opacity="0.2" />
                            <path d="M 148 105 L 148 125" stroke="#000" strokeWidth="1" opacity="0.2" />
                        </g>

                        {/* ABS (Rectus Abdominis) - Six pack with realistic segments */}
                        <g className="muscle-group cursor-pointer transition-opacity hover:opacity-90">
                            <title>Abs: {muscleData.abs} sets - {getLabel(muscleData.abs)}</title>
                            {/* Six pack structure with natural curves */}
                            <g fill={getColorForSets(muscleData.abs)} stroke="#18181b" strokeWidth="1.2">
                                {/* Upper abs */}
                                <path d="M 88 138 Q 85 145 88 152 L 96 152 Q 98 145 96 138 Z" />
                                <path d="M 104 138 Q 102 145 104 152 L 112 152 Q 115 145 112 138 Z" />
                                {/* Middle abs */}
                                <path d="M 87 156 Q 84 163 87 170 L 96 170 Q 98 163 96 156 Z" />
                                <path d="M 104 156 Q 102 163 104 170 L 113 170 Q 116 163 113 156 Z" />
                                {/* Lower abs */}
                                <path d="M 86 174 Q 83 181 86 188 L 95 188 Q 97 181 95 174 Z" />
                                <path d="M 105 174 Q 103 181 105 188 L 114 188 Q 117 181 114 174 Z" />
                            </g>
                            {/* Linea alba (center line) */}
                            <path d="M 100 138 Q 100 160 100 188" stroke="#18181b" strokeWidth="1.5" opacity="0.4" />
                        </g>

                        {/* BACK - Shown subtly since front view */}
                        <g className="muscle-group cursor-pointer" opacity="0.5">
                            <title>Back: {muscleData.back} sets - {getLabel(muscleData.back)}</title>
                            {/* Lats suggestion (sides) */}
                            <path
                                d="M 72 120 Q 68 145 72 170 L 78 170 Q 76 145 78 120 Z"
                                fill={getColorForSets(muscleData.back)}
                                stroke="#18181b"
                                strokeWidth="1"
                                opacity="0.4"
                            />
                            <path
                                d="M 128 120 Q 132 145 128 170 L 122 170 Q 124 145 122 120 Z"
                                fill={getColorForSets(muscleData.back)}
                                stroke="#18181b"
                                strokeWidth="1"
                                opacity="0.4"
                            />
                        </g>

                        {/* LEGS - Quadriceps with realistic muscle bellies */}
                        <g className="muscle-group cursor-pointer transition-opacity hover:opacity-90">
                            <title>Legs: {muscleData.legs} sets - {getLabel(muscleData.legs)}</title>
                            {/* Left Thigh - Quad group */}
                            <g>
                                {/* Vastus Lateralis (outer) */}
                                <ellipse
                                    cx="78" cy="270" rx="12" ry="45"
                                    fill={getColorForSets(muscleData.legs)}
                                    stroke="#18181b"
                                    strokeWidth="1.5"
                                />
                                {/* Rectus Femoris (center) */}
                                <ellipse
                                    cx="88" cy="268" rx="10" ry="42"
                                    fill={getColorForSets(muscleData.legs)}
                                    stroke="#18181b"
                                    strokeWidth="1.5"
                                />
                                {/* Vastus Medialis (inner) */}
                                <path
                                    d="M 92 240 Q 96 265 94 290 Q 100 295 102 270 Q 100 245 96 235 Z"
                                    fill={getColorForSets(muscleData.legs)}
                                    stroke="#18181b"
                                    strokeWidth="1.5"
                                />
                            </g>
                            {/* Right Thigh - mirrored */}
                            <g>
                                {/* Vastus Medialis (inner) */}
                                <path
                                    d="M 108 240 Q 104 265 106 290 Q 100 295 98 270 Q 100 245 104 235 Z"
                                    fill={getColorForSets(muscleData.legs)}
                                    stroke="#18181b"
                                    strokeWidth="1.5"
                                />
                                {/* Rectus Femoris */}
                                <ellipse
                                    cx="112" cy="268" rx="10" ry="42"
                                    fill={getColorForSets(muscleData.legs)}
                                    stroke="#18181b"
                                    strokeWidth="1.5"
                                />
                                {/* Vastus Lateralis */}
                                <ellipse
                                    cx="122" cy="270" rx="12" ry="45"
                                    fill={getColorForSets(muscleData.legs)}
                                    stroke="#18181b"
                                    strokeWidth="1.5"
                                />
                            </g>
                            {/* Left Calf - Gastrocnemius */}
                            <ellipse
                                cx="85" cy="360" rx="10" ry="32"
                                fill={getColorForSets(muscleData.legs)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Right Calf */}
                            <ellipse
                                cx="115" cy="360" rx="10" ry="32"
                                fill={getColorForSets(muscleData.legs)}
                                stroke="#18181b"
                                strokeWidth="1.5"
                            />
                            {/* Quad separation lines */}
                            <path d="M 85 240 L 85 305" stroke="#000" strokeWidth="0.8" opacity="0.2" />
                            <path d="M 115 240 L 115 305" stroke="#000" strokeWidth="0.8" opacity="0.2" />
                        </g>

                        {/* Skeletal connections (tendons/joints) */}
                        <g stroke="#3f3f46" strokeWidth="1.5" fill="none" opacity="0.3">
                            {/* Arms */}
                            <path d="M 60 108 L 52 148" />
                            <path d="M 140 108 L 148 148" />
                            {/* Legs */}
                            <path d="M 85 220 L 85 320" />
                            <path d="M 115 220 L 115 320" />
                            <path d="M 85 395 L 85 420" />
                            <path d="M 115 395 L 115 420" />
                        </g>
                    </svg>
                </div>

                {/* Stats Summary */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="text-zinc-400 mb-1">Chest</div>
                            <div className="text-lg font-bold" style={{ color: getColorForSets(muscleData.chest) }}>
                                {muscleData.chest}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="text-zinc-400 mb-1">Back</div>
                            <div className="text-lg font-bold" style={{ color: getColorForSets(muscleData.back) }}>
                                {muscleData.back}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="text-zinc-400 mb-1">Shoulders</div>
                            <div className="text-lg font-bold" style={{ color: getColorForSets(muscleData.shoulders) }}>
                                {muscleData.shoulders}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="text-zinc-400 mb-1">Arms</div>
                            <div className="text-lg font-bold" style={{ color: getColorForSets(muscleData.arms) }}>
                                {muscleData.arms}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="text-zinc-400 mb-1">Abs</div>
                            <div className="text-lg font-bold" style={{ color: getColorForSets(muscleData.abs) }}>
                                {muscleData.abs}
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                            <div className="text-zinc-400 mb-1">Legs</div>
                            <div className="text-lg font-bold" style={{ color: getColorForSets(muscleData.legs) }}>
                                {muscleData.legs}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
