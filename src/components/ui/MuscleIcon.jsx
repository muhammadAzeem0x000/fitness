import React from 'react';
import Model from 'react-body-highlighter';
import { HeartPulse, Search, Dumbbell } from 'lucide-react';

export function MuscleIcon({ category, className = "w-6 h-6", active = false }) {
    const color = active ? '#ffffff' : '#3b82f6'; // White if active tab, else blue-500
    const emptyColor = active ? 'rgba(255,255,255,0.2)' : 'rgba(148, 163, 184, 0.3)'; // bg-slate-400 opacity 30%

    // Ensure we handle case insensitivity
    const cat = (category || '').toLowerCase();

    if (cat === 'all') return <Search className={className} />;
    if (cat === 'cardio') return <HeartPulse className={className} />;

    let type = 'anterior';
    let muscles = [];

    switch (cat) {
        case 'chest':
            muscles = ['chest'];
            break;
        case 'back':
            type = 'posterior';
            muscles = ['upper-back', 'trapezius', 'lower-back'];
            break;
        case 'shoulders':
            type = 'posterior';
            muscles = ['back-deltoids'];
            break;
        case 'arms':
        case 'upper arms':
            muscles = ['biceps'];
            break;
        case 'lower arms':
            muscles = ['forearm'];
            break;
        case 'legs':
        case 'upper legs':
            muscles = ['quadriceps', 'calves'];
            break;
        case 'lower legs':
            muscles = ['calves'];
            break;
        case 'core':
        case 'waist':
            muscles = ['abs', 'obliques'];
            break;
        case 'neck':
            muscles = ['neck'];
            break;
        default:
            return <Dumbbell className={className} />;
    }

    return (
        <div className={`relative flex items-center justify-center overflow-hidden rounded-full ${className}`}>
            <div className="absolute inset-0 scale-[2.0] flex items-center justify-center mt-1">
                <Model
                    data={[{ name: cat, muscles }]}
                    style={{ width: '100%', height: '100%' }}
                    highlightedColors={[color]}
                    bodyColor={emptyColor}
                    type={type}
                />
            </div>
        </div>
    );
}
