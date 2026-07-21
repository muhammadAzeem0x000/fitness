import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent } from '../ui/Card';
import { useMuscleIntensity } from '../../hooks/useMuscleIntensity';
import { MUSCLE_LABELS } from '../../data/muscleMapping';
import { anteriorData, posteriorData } from 'react-body-highlighter/src/assets';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, RotateCcw, X, Info, Flame, Calendar, Dumbbell, Activity } from 'lucide-react';

const HEAT_COLORS = {
    0: { dark: '#3f3f46', light: '#cbd5e1' },   // Rested (zinc-700 / slate-300 for clear silhouette)
    1: { dark: '#3b82f6', light: '#3b82f6' },   // Active - blue
    2: { dark: '#f59e0b', light: '#f59e0b' },   // Productive - amber
    3: { dark: '#ef4444', light: '#ef4444' },   // Fatigued - red
};

const HEAT_LABELS = ['Rested', 'Active', 'Productive', 'Fatigued'];

function getHeatColor(level, isDark) {
    const c = HEAT_COLORS[level] || HEAT_COLORS[0];
    return isDark ? c.dark : c.light;
}

// Map internal muscle groups to Highlighter keys
const MUSCLE_MAP = {
    chest: ['chest'],
    shoulders: ['front-deltoids', 'back-deltoids'],
    traps: ['trapezius'],
    biceps: ['biceps'],
    triceps: ['triceps'],
    forearms: ['forearm'],
    abs: ['abs'],
    obliques: ['obliques'],
    back: ['upper-back'],
    lower_back: ['lower-back'],
    glutes: ['gluteal'],
    quads: ['quadriceps'],
    hamstrings: ['hamstring'],
    calves: ['calves']
};

const REVERSE_MUSCLE_MAP = Object.entries(MUSCLE_MAP).reduce((acc, [appKey, reactKeys]) => {
    reactKeys.forEach(rk => acc[rk] = appKey);
    return acc;
}, {});

// Helper to look up active muscle color
const getMuscleColor = (muscleName, data, highlightedColors, bodyColor) => {
    if (!data || !Array.isArray(data)) return bodyColor;
    const matched = data.find(item => item.muscles && item.muscles.includes(muscleName));
    if (matched && matched.frequency > 0) {
        const index = Math.min(matched.frequency - 1, highlightedColors.length - 1);
        return highlightedColors[index] || bodyColor;
    }
    return bodyColor;
};

// Anatomically Proportioned Low-Poly SVG Polygons for Hands & Feet
const ANTERIOR_EXTREMITIES = [
    // Left Hand (Front) - natural arm angle extension with thumb and tapered finger tips
    {
        id: 'front-left-hand',
        muscle: 'forearm',
        points: '0 100, -2.5 102.5, -5.0 105.0, -3.0 107.0, -3.5 112.5, -2.8 115.0, -1.2 114.2, 0.5 111.5, 3.2 106.5, 6.93877551 101.22449'
    },
    // Right Hand (Front) - natural arm angle extension with thumb and tapered finger tips
    {
        id: 'front-right-hand',
        muscle: 'forearm',
        points: '93.06122449 101.22449, 96.8 106.5, 99.5 111.5, 101.2 114.2, 102.8 115.0, 103.5 112.5, 103.0 107.0, 105.0 105.0, 102.5 102.5, 100 100.408163'
    },
    // Left Foot (Front) - athletic flared foot stance with lateral ankle curve, instep arch and toe base
    {
        id: 'front-left-foot',
        muscle: 'calves',
        points: '20.8163265 195.510204, 17.5 201.0, 16.0 207.0, 21.0 208.5, 27.0 208.0, 27.5 202.0, 27.3469388 194.693878'
    },
    // Right Foot (Front) - athletic flared foot stance with lateral ankle curve, instep arch and toe base
    {
        id: 'front-right-foot',
        muscle: 'calves',
        points: '72.6530612 195.102041, 72.5 202.0, 73.0 208.0, 79.0 208.5, 84.0 207.0, 82.5 201.0, 79.5918367 195.510204'
    }
];

const POSTERIOR_EXTREMITIES = [
    // Left Hand (Back) - dorsal hand view following arm trajectory
    {
        id: 'back-left-hand',
        muscle: 'forearm',
        points: '0 106.382979, -2.5 108.5, -5.0 111.0, -3.0 113.0, -3.5 118.5, -2.8 121.0, -1.2 120.2, 0.5 117.5, 3.2 112.5, 6.80851064 108.510638'
    },
    // Right Hand (Back) - dorsal hand view following arm trajectory
    {
        id: 'back-right-hand',
        muscle: 'forearm',
        points: '93.1914894 108.93617, 96.8 112.5, 99.5 117.5, 101.2 120.2, 102.8 121.0, 103.5 118.5, 103.0 113.0, 105.0 111.0, 102.5 108.5, 100 106.382979'
    },
    // Left Foot (Back) - anatomical heel calcaneus and Achilles stance
    {
        id: 'back-left-foot',
        muscle: 'calves',
        points: '28.5106383 213.617021, 24.5 218.0, 24.0 224.0, 31.0 225.0, 34.0 220.0, 33.6170213 201.702128'
    },
    // Right Foot (Back) - anatomical heel calcaneus and Achilles stance
    {
        id: 'back-right-foot',
        muscle: 'calves',
        points: '67.2340426 202.12766, 66.0 220.0, 69.0 225.0, 76.0 224.0, 75.5 218.0, 71.9148936 213.191489'
    }
];

const AnatomicalBodyModel = memo(function AnatomicalBodyModel({
    data = [],
    bodyColor = '#3f3f46',
    highlightedColors = ['#3b82f6', '#f59e0b', '#ef4444'],
    onClick,
    style,
    type = 'anterior',
}) {
    const isAnterior = type === 'anterior';
    const rawData = isAnterior ? anteriorData : posteriorData;
    const extremities = isAnterior ? ANTERIOR_EXTREMITIES : POSTERIOR_EXTREMITIES;
    const viewBox = isAnterior ? '-8 -3 116 218' : '-8 -3 116 236';

    const handleClick = (muscle) => {
        if (onClick) onClick({ muscle });
    };

    return (
        <div style={style} className="rbh-wrapper">
            <svg
                className="rbh w-full h-full"
                viewBox={viewBox}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Main Muscle Polygons */}
                {rawData.map((exercise) =>
                    exercise.svgPoints.map((points, index) => {
                        const fillColor = getMuscleColor(exercise.muscle, data, highlightedColors, bodyColor);
                        return (
                            <polygon
                                key={`${exercise.muscle}-${index}`}
                                points={points}
                                onClick={() => handleClick(exercise.muscle)}
                                style={{
                                    cursor: 'pointer',
                                    fill: fillColor,
                                    transition: 'fill 0.3s ease, filter 0.25s ease',
                                }}
                            />
                        );
                    })
                )}

                {/* Seamless Low-Poly Hands & Feet Polygons */}
                {extremities.map((item) => {
                    const fillColor = getMuscleColor(item.muscle, data, highlightedColors, bodyColor);
                    return (
                        <polygon
                            key={item.id}
                            points={item.points}
                            onClick={() => handleClick(item.muscle)}
                            style={{
                                cursor: 'pointer',
                                fill: fillColor,
                                transition: 'fill 0.3s ease, filter 0.25s ease',
                            }}
                        />
                    );
                })}
            </svg>
        </div>
    );
});

export function BodyHeatmap3D({ workouts = [] }) {
    const [timeRange, setTimeRange] = useState(7);
    const muscleData = useMuscleIntensity(workouts, timeRange);
    const [selectedMuscle, setSelectedMuscle] = useState(null);
    const [viewAngle, setViewAngle] = useState('anterior'); // 'anterior' | 'posterior'
    const [isDark, setIsDark] = useState(true);

    // Detect theme
    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const selectedData = selectedMuscle ? muscleData[selectedMuscle] : null;
    const selectedLabel = selectedMuscle ? MUSCLE_LABELS[selectedMuscle] : null;

    const topMuscles = Object.entries(muscleData)
        .filter(([, d]) => d.sets > 0)
        .sort((a, b) => b[1].sets - a[1].sets)
        .slice(0, 6);

    const isFront = viewAngle === 'anterior';

    const modelData = useMemo(() => {
        const dataArray = [];
        Object.entries(muscleData).forEach(([appMuscle, data]) => {
            if (data.level > 0 && MUSCLE_MAP[appMuscle]) {
                dataArray.push({
                    name: appMuscle,
                    muscles: MUSCLE_MAP[appMuscle],
                    frequency: data.level
                });
            }
        });
        return dataArray;
    }, [muscleData]);

    const highlightedColors = [
        getHeatColor(1, isDark),
        getHeatColor(2, isDark),
        getHeatColor(3, isDark)
    ];

    const handleModelClick = useCallback(({ muscle }) => {
        const appKey = REVERSE_MUSCLE_MAP[muscle];
        if (appKey) {
            setSelectedMuscle(prev => prev === appKey ? null : appKey);
        } else {
            setSelectedMuscle(null);
        }
    }, []);

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .rbh polygon { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
            .rbh polygon:hover { filter: brightness(1.4) drop-shadow(0 0 4px rgba(255,255,255,0.3)); }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    return (
        <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-200 dark:ring-zinc-800">
            <CardContent className="p-0">
                {/* Header Section with dynamic gradient */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 border-b border-slate-200 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Activity className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-0.5">
                                    Muscle Activation
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400">
                                    Interactive {timeRange}-day intensity map
                                </p>
                            </div>
                        </div>
                        {/* Premium Time Range Selector */}
                        <div className="flex bg-slate-200/50 dark:bg-zinc-800/50 rounded-lg p-1 backdrop-blur-sm self-start sm:self-auto">
                            {[7, 14, 30].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setTimeRange(d)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                                        timeRange === d
                                            ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'
                                    }`}
                                >
                                    {d} Days
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-5 md:p-6 bg-white dark:bg-[#0a0a0a]">
                    {/* View Toggles & Legend */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/50 dark:border-zinc-800">
                            <button
                                onClick={() => setViewAngle('anterior')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    isFront
                                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                                }`}
                            >
                                <Eye className="w-4 h-4" /> Front
                            </button>
                            <button
                                onClick={() => setViewAngle('posterior')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    !isFront
                                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300'
                                }`}
                            >
                                <RotateCcw className="w-4 h-4" /> Back
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-3 bg-slate-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                            {[0, 1, 2, 3].map(level => (
                                <div key={level} className="flex items-center gap-1.5 px-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-slate-50 dark:ring-offset-zinc-900"
                                        style={{ backgroundColor: getHeatColor(level, isDark), ringColor: `${getHeatColor(level, isDark)}40` }}
                                    />
                                    <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                                        {HEAT_LABELS[level]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_300px] gap-8">
                        {/* SVG Vector Body Map */}
                        <div 
                            className="relative flex justify-center items-center rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800/80 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-zinc-900/20 dark:to-zinc-900/60 p-4 min-h-[400px]"
                            onClick={() => setSelectedMuscle(null)}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />
                            
                            <motion.div 
                                className="relative z-10 w-full flex justify-center"
                                key={viewAngle}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                            >
                                <AnatomicalBodyModel
                                    data={modelData}
                                    style={{ height: '400px', width: '100%', maxWidth: '280px', filter: isDark ? 'drop-shadow(0 0 20px rgba(255,255,255,0.06))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}
                                    type={viewAngle}
                                    bodyColor={HEAT_COLORS[0][isDark ? 'dark' : 'light']}
                                    highlightedColors={highlightedColors}
                                    onClick={handleModelClick}
                                />
                            </motion.div>
                        </div>

                        {/* Interactive Side Panel */}
                        <div className="flex flex-col gap-4">
                            {/* Selected Muscle Glassmorphism Panel */}
                            <AnimatePresence mode="wait">
                                {selectedMuscle && selectedData && selectedLabel ? (
                                    <motion.div
                                        key={selectedMuscle}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-500/20 dark:border-blue-500/20 shadow-lg backdrop-blur-md"
                                    >
                                        <button
                                            onClick={() => setSelectedMuscle(null)}
                                            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/50 dark:bg-black/20 text-slate-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-black/40 hover:text-slate-900 dark:hover:text-white transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>

                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-zinc-800 text-2xl">
                                                {selectedLabel.emoji}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                                    {selectedLabel.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div 
                                                        className="w-2 h-2 rounded-full animate-pulse" 
                                                        style={{ backgroundColor: getHeatColor(selectedData.level, isDark) }}
                                                    />
                                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-300">
                                                        {HEAT_LABELS[selectedData.level]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-white/40 dark:border-zinc-800/40">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                                                    <Flame className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Active Sets</span>
                                                </div>
                                                <span className="text-base font-bold text-slate-900 dark:text-white">
                                                    {selectedData.sets}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-white/40 dark:border-zinc-800/40">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                                                    <Dumbbell className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Total Volume</span>
                                                </div>
                                                <span className="text-base font-bold text-slate-900 dark:text-white">
                                                    {selectedData.volume > 999
                                                        ? `${(selectedData.volume / 1000).toFixed(1)}k`
                                                        : selectedData.volume}
                                                    <span className="text-xs text-slate-400 dark:text-zinc-500 font-normal ml-1">kg</span>
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-white/40 dark:border-zinc-800/40">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Last Trained</span>
                                                </div>
                                                <span className="text-base font-bold text-slate-900 dark:text-white">
                                                    {selectedData.daysSince !== null ? `${selectedData.daysSince}d ago` : 'Never'}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/20"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-3 text-slate-400 dark:text-zinc-500">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-300 mb-1">
                                            Inspect Anatomy
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-zinc-500">
                                            Tap any muscle group on the diagram to see your training volume and recovery status.
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Top Focused Muscles - Premium Grid */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/50">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            Most Active Zones
                        </h4>
                        
                        {topMuscles.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {topMuscles.map(([key, data]) => {
                                    const label = MUSCLE_LABELS[key];
                                    const color = getHeatColor(data.level, isDark);
                                    
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedMuscle(key)}
                                            className={`relative overflow-hidden group flex flex-col p-3 rounded-xl border text-left transition-all duration-300 ${
                                                selectedMuscle === key
                                                    ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 shadow-sm'
                                                    : 'bg-white dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-sm hover:-translate-y-0.5'
                                            }`}
                                        >
                                            <div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-zinc-800 w-full" />
                                            <div 
                                                className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-out" 
                                                style={{ 
                                                    width: `${Math.min((data.sets / 15) * 100, 100)}%`,
                                                    backgroundColor: color
                                                }} 
                                            />
                                            
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-lg opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {label?.emoji}
                                                </span>
                                                <span 
                                                    className="text-lg font-black"
                                                    style={{ color }}
                                                >
                                                    {data.sets}
                                                </span>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate">
                                                {label?.name || key}
                                            </span>
                                            <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">
                                                Sets
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 dark:bg-zinc-900/30 dark:border-zinc-800 text-center">
                                <Dumbbell className="w-6 h-6 text-slate-300 dark:text-zinc-600 mb-2" />
                                <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">No workout data</p>
                                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">Log workouts to populate your top zones</p>
                            </div>
                        )}
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
