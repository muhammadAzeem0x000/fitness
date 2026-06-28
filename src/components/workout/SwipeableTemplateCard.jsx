import React, { useRef, useState } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { Trash2, Edit3, MoreHorizontal } from 'lucide-react';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { formatDistanceToNow } from 'date-fns';

export function SwipeableTemplateCard({ 
    routine, 
    isSelected, 
    onSelect, 
    onEdit, 
    onDelete, 
    workoutLogs = [] 
}) {
    const controls = useAnimation();
    const x = useMotionValue(0);
    const containerRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Compute last performed date
    const lastWorkout = workoutLogs.find(log => log.routineId === routine.id || log.routineName === routine.name);
    const lastPerformedStr = lastWorkout 
        ? formatDistanceToNow(new Date(lastWorkout.date), { addSuffix: true })
        : 'Never';

    // Source badge
    const source = routine.source || 'onboarding';
    let BadgeIcon = null;
    let badgeColor = 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400';
    let badgeText = 'Custom';

    if (source === 'ai') {
        badgeColor = 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300';
        badgeText = 'AI';
    } else if (source === 'onboarding') {
        badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
        badgeText = 'Starter';
    }

    const handleDragEnd = (event, info) => {
        const threshold = 60;
        if (info.offset.x < -threshold) {
            controls.start({ x: -140 }); // Reveal both edit and delete buttons
            hapticLight();
        } else if (info.offset.x > threshold) {
            controls.start({ x: 0 }); // Close
        } else {
            controls.start({ x: 0 }); // Snap back
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl mb-3" ref={containerRef}>
            {/* Background Action Buttons (Revealed on Swipe) */}
            <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end w-full px-4 gap-3 bg-red-500/10 dark:bg-red-500/5">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        controls.start({ x: 0 });
                        onEdit(routine);
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 active:scale-95 transition-transform"
                >
                    <Edit3 className="w-5 h-5" />
                </button>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        controls.start({ x: 0 });
                        onDelete(routine.id);
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500 text-white active:scale-95 transition-transform"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Foreground Card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -150, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                animate={controls}
                style={{ x }}
                className={`
                    relative z-10 w-full p-4 rounded-xl border text-left transition-colors flex flex-col justify-center
                    ${isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80'}
                `}
                onClick={(e) => {
                    // Prevent select if we are swiped open
                    if (x.get() < -10) {
                        controls.start({ x: 0 });
                    } else {
                        onSelect(routine);
                    }
                }}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        {routine.name}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${isSelected ? 'bg-blue-500 text-white' : badgeColor}`}>
                        {badgeText}
                    </span>
                </div>
                
                <div className="flex justify-between items-end mt-1">
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-zinc-400'}`}>
                        {routine.exercises?.length || 0} exercises
                    </span>
                    <span className={`text-xs ${isSelected ? 'text-blue-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {lastPerformedStr}
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
