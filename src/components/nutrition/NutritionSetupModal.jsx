import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Settings2, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useToast } from '../../context/ToastContext';
import { hapticSuccess, hapticError } from '../../lib/haptics';
import { validatePhysicalStats } from '../../lib/fitnessUtils';

const SectionRow = ({ label, children }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-zinc-800 last:border-0">
        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{label}</span>
        <div className="flex items-center justify-end">
            {children}
        </div>
    </div>
);

const CustomSelect = ({ value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-3 py-1.5 flex items-center gap-2 min-w-[120px] justify-end"
            >
                <span className="truncate">{options.find(o => o.value === value)?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                        {options.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-right px-4 py-2.5 text-sm font-medium transition-colors ${value === opt.value ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-700'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export function NutritionSetupModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const { profile, updateProfile } = useProfile(user?.id);
    const { convertWeightToDb, displayWeight, formatWeightLabel, preferences, convertHeightToCm, formatHeightValue } = useUserPreferences();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);

    // Form state
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('male');
    const [activityLevel, setActivityLevel] = useState('sedentary');
    const [goalType, setGoalType] = useState('maintain');
    const [currentWeightInput, setCurrentWeightInput] = useState('');
    const [heightVal1, setHeightVal1] = useState('');
    const [heightVal2, setHeightVal2] = useState('');

    const isFeet = preferences?.heightUnit === 'ft';

    useEffect(() => {
        if (isOpen && profile) {
            setAge(profile.age?.toString() || '');
            setGender(profile.gender || 'male');
            setActivityLevel(profile.activity_level || 'sedentary');
            setGoalType(profile.goal_type || 'maintain');
            setCurrentWeightInput(profile.current_weight ? displayWeight(profile.current_weight) : '');
            
            if (profile.height) {
                const h = formatHeightValue(profile.height);
                setHeightVal1(h.val1?.toString() || '');
                setHeightVal2(h.val2?.toString() || '');
            }
        }
    }, [isOpen, profile, displayWeight, formatHeightValue]);

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!age || !currentWeightInput || !heightVal1 || (isFeet && !heightVal2)) {
            hapticError();
            toast.error('Please fill in all required fields.');
            return;
        }

        setLoading(true);
        try {
            const newWeight = convertWeightToDb(currentWeightInput);
            const newHeight = convertHeightToCm(heightVal1, heightVal2, preferences.heightUnit);

            const validationError = validatePhysicalStats(newWeight, newHeight);
            if (validationError) {
                hapticError();
                toast.error(validationError);
                setLoading(false);
                return;
            }

            await updateProfile({
                age: parseInt(age),
                gender,
                activity_level: activityLevel,
                goal_type: goalType,
                current_weight: newWeight,
                height: newHeight
            });
            
            hapticSuccess();
            toast.success("Profile updated! Nutrition tracking is now unlocked.");
            onClose();
        } catch (error) {
            hapticError();
            console.error("Failed to save profile", error);
            toast.error("Failed to save profile changes.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 h-[100dvh]">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={{ top: 0, bottom: 1 }}
                    onDragEnd={(e, info) => {
                        if (info.offset.y > 100 || info.velocity.y > 500) {
                            onClose();
                        }
                    }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
                >
                    {/* Drag Handle for Mobile */}
                    <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 left-0 z-20">
                        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                    </div>

                    <div className="relative z-10 pt-10 pb-4 px-6 text-center border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 shrink-0">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-200/50 hover:bg-slate-300 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 text-slate-600 dark:text-slate-300 transition-colors hidden sm:block"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-sm mb-3">
                            <Settings2 className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                        </div>
                        
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            Setup Nutrition Profile
                        </h2>
                        <p className="text-slate-500 dark:text-zinc-400 text-xs px-4">
                            We need a few details to calculate your daily calorie and macro targets.
                        </p>
                    </div>

                    <div className="overflow-y-auto px-6 py-2 pb-6 custom-scrollbar flex-1">
                        <form onSubmit={handleSave} className="space-y-2 mt-2">
                            
                            <SectionRow label="Age">
                                <input
                                    type="number"
                                    required
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    placeholder="Age"
                                    className="w-16 text-right bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-2 py-1 placeholder:text-slate-400"
                                />
                            </SectionRow>
                            
                            <SectionRow label="Gender">
                                <CustomSelect
                                    value={gender}
                                    onChange={setGender}
                                    options={[
                                        { value: 'male', label: 'Male' },
                                        { value: 'female', label: 'Female' }
                                    ]}
                                />
                            </SectionRow>

                            <SectionRow label="Activity Level">
                                <CustomSelect
                                    value={activityLevel}
                                    onChange={setActivityLevel}
                                    options={[
                                        { value: 'sedentary', label: 'Sedentary' },
                                        { value: 'lightly_active', label: 'Lightly Active' },
                                        { value: 'moderately_active', label: 'Moderately Active' },
                                        { value: 'very_active', label: 'Very Active' },
                                        { value: 'super_active', label: 'Super Active' }
                                    ]}
                                />
                            </SectionRow>

                            <SectionRow label="Goal">
                                <CustomSelect
                                    value={goalType}
                                    onChange={setGoalType}
                                    options={[
                                        { value: 'maintain', label: 'Maintain' },
                                        { value: 'cut', label: 'Cut' },
                                        { value: 'bulk', label: 'Bulk' }
                                    ]}
                                />
                            </SectionRow>

                            <SectionRow label={`Current Weight (${formatWeightLabel ? formatWeightLabel() : 'kg'})`}>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={currentWeightInput}
                                    onChange={(e) => setCurrentWeightInput(e.target.value)}
                                    placeholder="0.0"
                                    className="w-20 text-right bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-2 py-1 placeholder:text-slate-400"
                                />
                            </SectionRow>

                            <SectionRow label={`Height (${isFeet ? 'FT / IN' : 'CM'})`}>
                                <div className="flex items-center justify-end gap-1">
                                    <input
                                        type="number"
                                        required
                                        value={heightVal1}
                                        onChange={(e) => setHeightVal1(e.target.value)}
                                        placeholder={isFeet ? "Ft" : "Cm"}
                                        className="w-16 text-right bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-2 py-1 placeholder:text-slate-400"
                                    />
                                    {isFeet && (
                                        <>
                                            <span className="text-slate-400 font-medium">'</span>
                                            <input
                                                type="number"
                                                required
                                                value={heightVal2}
                                                onChange={(e) => setHeightVal2(e.target.value)}
                                                placeholder="In"
                                                className="w-16 text-right bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-2 py-1 placeholder:text-slate-400"
                                            />
                                            <span className="text-slate-400 font-medium">"</span>
                                        </>
                                    )}
                                </div>
                            </SectionRow>

                            <div className="pt-6">
                                <Button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full h-12 text-base font-bold bg-amber-500 hover:bg-amber-600 text-white border-0 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                    {loading ? 'Saving...' : 'Calculate Targets'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
