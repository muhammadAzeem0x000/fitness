import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Dumbbell, Star, X } from 'lucide-react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

const ICON_MAP = {
    Trophy: Trophy,
    Flame: Flame,
    Dumbbell: Dumbbell,
    Star: Star
};

export function AchievementUnlockedToast({ achievement, onClose }) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (achievement) {
            setShow(true);
            // Auto hide after 6 seconds
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 500); // wait for exit animation
            }, 6000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    const IconComponent = ICON_MAP[achievement.icon_name] || Trophy;

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none p-4">
                    <Confetti
                        recycle={false}
                        numberOfPieces={300}
                        gravity={0.2}
                    />
                    
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -50 }}
                        className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-white pointer-events-auto relative overflow-hidden"
                    >
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                        
                        <button 
                            onClick={() => {
                                setShow(false);
                                setTimeout(onClose, 500);
                            }}
                            className="absolute top-3 right-3 text-white/70 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 backdrop-blur-sm shadow-inner">
                                <IconComponent className="w-10 h-10 text-white drop-shadow-md" />
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-amber-100 mb-1">Achievement Unlocked</h3>
                                <h2 className="text-2xl font-black text-white drop-shadow-sm mb-2">{achievement.name}</h2>
                                <p className="text-amber-100/90 text-sm">{achievement.description}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
