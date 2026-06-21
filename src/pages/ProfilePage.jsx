import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, Camera, Loader2, KeyRound, ChevronDown, ChevronUp, Crown, ExternalLink, Sparkles, Trophy, Lock, Activity, Heart, Ruler, Utensils } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWeight } from '../hooks/useWeight';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { PasswordInput } from '../components/ui/PasswordInput';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticLight, hapticSuccess, hapticError, hapticMedium } from '../lib/haptics';

const CollapsibleSection = ({ title, icon: Icon, defaultOpen = false, children, extraHeader }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setIsOpen(!isOpen);
                }}
                className="w-full flex items-center justify-between p-5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 uppercase tracking-wider transition-colors"
            >
                <span className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4" />} {title}
                </span>
                <div className="flex items-center gap-3">
                    {extraHeader}
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-2 space-y-4">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { profile, updateProfile } = useProfile(user?.id);
    const { addWeightEntry } = useWeight(user?.id);
    const { subscription, isPremium, isTrialing, isTrialExpired, isCanceled } = useSubscription();
    
    const hasUsedTrial = isTrialExpired ||
        subscription?.status === 'canceled' ||
        subscription?.status === 'past_due' ||
        subscription?.status === 'active' ||
        !!subscription?.stripe_subscription_id;

    const { convertWeightToDb, displayWeight, formatWeightLabel } = useUserPreferences();

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentWeightInput, setCurrentWeightInput] = useState('');
    const { toast } = useToast();

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [goalWeightInput, setGoalWeightInput] = useState('');
    const [workoutDays, setWorkoutDays] = useState([]);
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('male');
    const [activityLevel, setActivityLevel] = useState('sedentary');
    const [goalType, setGoalType] = useState('maintain');
    const [isDirty, setIsDirty] = useState(false);
    const fileInputRef = useRef(null);

    // Password Update State
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Sync with profile
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setAvatarUrl(profile.avatar_url || '');
            setGoalWeightInput(profile.goal_weight ? displayWeight(profile.goal_weight) : '');
            setWorkoutDays(profile.workout_days || []);
            setAge(profile.age?.toString() || '');
            setGender(profile.gender || 'male');
            setActivityLevel(profile.activity_level || 'sedentary');
            setGoalType(profile.goal_type || 'maintain');
            setIsDirty(false);
        }
    }, [profile]);

    // Height state
    const { preferences, convertHeightToCm, formatHeightValue } = useUserPreferences();
    const [heightVal1, setHeightVal1] = useState('');
    const [heightVal2, setHeightVal2] = useState('');

    useEffect(() => {
        if (profile?.height) {
            const h = formatHeightValue(profile.height);
            setHeightVal1(h.val1?.toString() || '');
            setHeightVal2(h.val2?.toString() || '');
        }
    }, [profile, formatHeightValue]);

    const isFeet = preferences.heightUnit === 'ft';

    const handleSave = async () => {
        setLoading(true);
        try {
            const newGoalWeight = convertWeightToDb(goalWeightInput);
            const newHeight = convertHeightToCm(heightVal1, heightVal2, preferences.heightUnit);
            
            await updateProfile({
                display_name: displayName,
                avatar_url: avatarUrl,
                goal_weight: newGoalWeight,
                height: newHeight,
                workout_days: workoutDays,
                age: age ? parseInt(age) : null,
                gender,
                activity_level: activityLevel,
                goal_type: goalType
            });
            hapticSuccess();
            toast.success("Profile updated successfully!");
        } catch (error) {
            hapticError();
            console.error("Failed to save profile", error);
            toast.error("Failed to save profile changes.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            hapticError();
            toast.error("Passwords do not match!");
            return;
        }
        if (newPassword.length < 6) {
            hapticError();
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            hapticSuccess();
            toast.success("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
            setPasswordOpen(false);
        } catch (error) {
            hapticError();
            toast.error("Error updating password: " + error.message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleWeightLog = async () => {
        if (!currentWeightInput) return;
        try {
            const weightInKg = convertWeightToDb(currentWeightInput);
            await addWeightEntry(weightInKg);
            hapticSuccess();
            toast.success("Weight logged successfully!");
            setCurrentWeightInput('');
        } catch (error) {
            hapticError();
            toast.error("Failed to log weight.");
        }
    };

    const handleSignOut = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            setLoading(true);
            await signOut();
            localStorage.removeItem('sb-hvjchdgthkxqdvxrjero-auth-token');
            localStorage.removeItem('supabase.auth.token');
        } catch (error) {
            console.error("Error signing out:", error);
            localStorage.removeItem('sb-hvjchdgthkxqdvxrjero-auth-token');
        } finally {
            window.location.href = '/';
        }
    };

    const toggleDay = (day) => {
        hapticMedium();
        const newDays = workoutDays.includes(day)
            ? workoutDays.filter(d => d !== day)
            : [...workoutDays, day];
        setWorkoutDays(newDays);
        setIsDirty(true);
    };

    const handleAvatarUpload = async (event) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

            setAvatarUrl(data.publicUrl);
            setIsDirty(true);
            toast.success("Avatar uploaded! Don't forget to save changes.");
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Error uploading avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="w-full max-w-md mx-auto p-4 pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Section: Avatar + Name Side-by-Side */}
            <div className="flex flex-col items-center gap-4 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                {/* Avatar */}
                <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700 shadow-md group-hover:border-slate-400 dark:group-hover:border-zinc-500 transition-colors relative">
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                        )}
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800">
                                <User className="w-12 h-12" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Camera className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                </div>

                {/* Name */}
                <div className="w-full">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1 block text-center">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                        placeholder="Your Name"
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-center text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Body Metrics Section */}
            <CollapsibleSection title="Body Metrics" icon={Ruler} defaultOpen={true}>
                <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                        Log Today's Weight ({formatWeightLabel()})
                    </label>
                    <div className="flex gap-2 w-full">
                        <input
                            type="number"
                            step="0.1"
                            value={currentWeightInput}
                            onChange={(e) => setCurrentWeightInput(e.target.value)}
                            placeholder={`e.g. 180`}
                            className="flex-1 min-w-0 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                        />
                        <Button className="px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold" onClick={handleWeightLog}>
                            Log
                        </Button>
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                        Height ({isFeet ? 'FT / IN' : 'CM'})
                    </label>
                    <div className={`grid gap-3 w-full ${isFeet ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <input
                            type="number"
                            value={heightVal1}
                            onChange={(e) => { setHeightVal1(e.target.value); setIsDirty(true); }}
                            placeholder={isFeet ? "Ft" : "Cm"}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-center"
                        />
                        {isFeet && (
                            <input
                                type="number"
                                value={heightVal2}
                                onChange={(e) => { setHeightVal2(e.target.value); setIsDirty(true); }}
                                placeholder="In"
                                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-center"
                            />
                        )}
                    </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/50">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
                        Goal Weight ({formatWeightLabel()})
                    </label>
                    <input
                        type="number"
                        step="0.1"
                        value={goalWeightInput}
                        onChange={(e) => { setGoalWeightInput(e.target.value); setIsDirty(true); }}
                        placeholder="e.g. 180"
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600 text-center"
                    />
                </div>
            </CollapsibleSection>

            {/* Nutrition & Goals Section */}
            <CollapsibleSection title="Nutrition Profile" icon={Utensils} defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">Age</label>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => { setAge(e.target.value); setIsDirty(true); }}
                            placeholder="Age"
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">Gender</label>
                        <select
                            value={gender}
                            onChange={(e) => { setGender(e.target.value); setIsDirty(true); }}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">Activity Level</label>
                        <select
                            value={activityLevel}
                            onChange={(e) => { setActivityLevel(e.target.value); setIsDirty(true); }}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="sedentary">Sedentary</option>
                            <option value="lightly_active">Lightly Active</option>
                            <option value="moderately_active">Moderately Active</option>
                            <option value="very_active">Very Active</option>
                            <option value="super_active">Super Active</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">Goal</label>
                        <select
                            value={goalType}
                            onChange={(e) => { setGoalType(e.target.value); setIsDirty(true); }}
                            className="w-full bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="maintain">Maintain</option>
                            <option value="cut">Cut</option>
                            <option value="bulk">Bulk</option>
                        </select>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Training Schedule */}
            <CollapsibleSection title="Training Schedule" icon={Calendar} defaultOpen={false}>
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {days.map(day => {
                        const isSelected = workoutDays.includes(day);
                        return (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`aspect-square flex items-center justify-center text-sm rounded-full transition-all font-semibold active:scale-90 ${isSelected
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                    : 'bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {day.slice(0, 1)}
                            </button>
                        );
                    })}
                </div>
            </CollapsibleSection>

            {/* Gamification & Health */}
            <CollapsibleSection 
                title="Achievements & Sync" 
                icon={Trophy} 
                defaultOpen={false} 
                extraHeader={<span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">1 / 5</span>}
            >
                <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="aspect-square bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-inner relative group cursor-pointer">
                        <Trophy className="w-6 h-6 text-white drop-shadow" />
                        <div className="absolute inset-0 bg-black/80 text-white text-[10px] p-1 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            First Step
                        </div>
                    </div>
                    {/* Locked badges */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-square bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center opacity-50 relative group cursor-pointer border border-slate-200 dark:border-zinc-700">
                            <Lock className="w-5 h-5 text-slate-400 dark:text-zinc-600" />
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Health Sync</p>
                            <p className="text-[10px] text-slate-500">Connect to Apple / Google</p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8"
                        onClick={async () => {
                            const { requestHealthPermissions } = await import('../lib/wearables');
                            const success = await requestHealthPermissions();
                            if(success) {
                                toast.success("Health sync activated!");
                            } else {
                                toast.error("Failed to connect health data.");
                            }
                        }}
                    >
                        Connect
                    </Button>
                </div>
            </CollapsibleSection>

            {/* Subscription Plan Section */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-400' : 'text-slate-500 dark:text-zinc-500'}`} />
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Current Plan</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isTrialExpired
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : isPremium
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700'
                            }`}>
                            {isTrialExpired ? 'Trial Expired' : isTrialing ? 'Free Trial' : isPremium ? (subscription?.plan_id === (import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_1TfEnwESf91DrGyE4XWhZzVs') ? 'Pro Yearly' : 'Pro Monthly') : 'Free'}
                        </span>
                    </div>

                    {isTrialExpired && (
                        <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400 font-medium leading-relaxed">Your free trial has ended. Subscribe now to keep using Pro features.</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-slate-500 dark:text-zinc-400">
                            {isCanceled ? (
                                <span className="text-red-400">Canceled (Expires {new Date(subscription?.current_period_end).toLocaleDateString()})</span>
                            ) : isTrialExpired ? (
                                <span className="text-red-400">Expired on {new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                            ) : isTrialing ? (
                                <span className="text-blue-400">Trial ends {new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                            ) : isPremium ? (
                                <span>Renews {new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                            ) : hasUsedTrial ? (
                                <span>Upgrade to unlock premium</span>
                            ) : (
                                <span>Start your 14-day free trial</span>
                            )}
                        </div>

                        {isPremium && !isTrialExpired ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 px-4 text-xs gap-1.5 rounded-xl border-slate-300 dark:border-zinc-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                                disabled={portalLoading}
                                onClick={async () => {
                                    try {
                                        setPortalLoading(true);
                                        const { supabase } = await import('../lib/supabase');
                                        const { data, error } = await supabase.functions.invoke('create-portal-session', {
                                            body: { customerId: subscription?.stripe_customer_id }
                                        });
                                        if (error) throw error;
                                        if (data?.url) window.open(data.url, '_blank');
                                    } catch (err) {
                                        toast.error("Failed to open subscription portal");
                                    } finally {
                                        setPortalLoading(false);
                                    }
                                }}
                            >
                                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                                Manage
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className={`h-9 px-4 text-xs gap-1.5 rounded-xl ${isTrialExpired ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                                onClick={() => navigate('/pricing')}
                            >
                                {isTrialExpired ? 'Subscribe' : hasUsedTrial ? 'Upgrade' : 'Try Free'} <Sparkles className="w-3 h-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Section */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900/50">
                <button
                    onClick={() => setPasswordOpen(!passwordOpen)}
                    className="w-full flex items-center justify-between p-5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-300 uppercase tracking-wider transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4" /> Change Password
                    </span>
                    {passwordOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                    {passwordOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-5 pt-0 space-y-3">
                                <PasswordInput
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="New Password"
                                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                />
                                <PasswordInput
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                                />
                                <Button
                                    size="sm"
                                    onClick={handlePasswordUpdate}
                                    disabled={passwordLoading || !newPassword || !confirmPassword}
                                    className="w-full h-11 rounded-xl"
                                >
                                    {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Update Password
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-blue-500/20"
                disabled={!isDirty || loading || uploading}
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>

            {/* Log Out Button */}
            <button
                onClick={handleSignOut}
                className="w-full py-4 text-sm font-semibold text-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2 rounded-xl bg-red-500/5 hover:bg-red-500/10"
            >
                <LogOut className="w-4 h-4" /> Log Out
            </button>
        </div>
    );
}
