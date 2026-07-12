import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, Loader2, KeyRound, Crown, Sparkles, Activity, Heart, Ruler, Utensils, RefreshCw, Footprints, Moon, Flame, Smartphone, CheckCircle2, WifiOff, Pencil } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWeight } from '../hooks/useWeight';
import { useSubscription } from '../hooks/useSubscription';
import { useHealthSync } from '../hooks/useHealthSync';
import { useHealthMetrics } from '../hooks/useHealthMetrics';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { PasswordInput } from '../components/ui/PasswordInput';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { usePricing } from '../context/PricingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticLight, hapticSuccess, hapticError, hapticMedium } from '../lib/haptics';
import { requestHealthPermissions, openHealthSettings } from '../lib/wearables';
import { validatePhysicalStats } from '../lib/fitnessUtils';

const Section = ({ title, children, icon: Icon }) => (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-[12px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-2 px-2">
            {Icon && <Icon className="w-3.5 h-3.5" />} {title}
        </h2>
        <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
            {children}
        </div>
    </div>
);

const SectionRow = ({ label, children, border = true }) => (
    <div className={`p-4 flex items-center justify-between ${border ? 'border-b border-slate-100 dark:border-zinc-800/50' : ''}`}>
        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{label}</span>
        <div className="flex-1 flex justify-end items-center">
            {children}
        </div>
    </div>
);

const SubscriptionBanner = ({ isPremium, isTrialExpired, isTrialing, isCanceled, subscription, openPricing, hasUsedTrial }) => {
    const openPlayStoreSubscriptions = () => {
        // Deep link to Play Store subscription management
        window.open('https://play.google.com/store/account/subscriptions?sku=musclebot_pro_monthly&package=com.musclebot.app', '_system');
    };

    if (isPremium && !isTrialExpired) {
        const endDate = subscription?.current_period_end;
        const hasValidDate = endDate && new Date(endDate).getFullYear() > 2000;
        
        let statusText = 'Active Plan';
        if (isCanceled && hasValidDate) {
            statusText = `Canceled · Access until ${new Date(endDate).toLocaleDateString()}`;
        } else if (isTrialing && hasValidDate) {
            statusText = `Free Trial · Ends ${new Date(endDate).toLocaleDateString()}`;
        } else if (hasValidDate) {
            statusText = `Renews ${new Date(endDate).toLocaleDateString()}`;
        }

        return (
            <div className={`rounded-3xl p-5 text-white shadow-xl mb-8 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 ${
                isCanceled 
                    ? 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/20' 
                    : 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/20'
            }`}>
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Crown className="w-5 h-5 text-amber-100" />
                        <h3 className="font-bold text-lg tracking-tight">{isCanceled ? 'Pro (Canceled)' : 'Pro Member'}</h3>
                    </div>
                    <p className={`text-xs font-medium ${isCanceled ? 'text-slate-300' : 'text-amber-100'}`}>{statusText}</p>
                </div>
                <Button size="sm" onClick={openPlayStoreSubscriptions} className="bg-white/20 hover:bg-white/30 text-white border-0 h-10 px-5 rounded-2xl font-semibold backdrop-blur-md transition-all active:scale-95">
                    Manage
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/20 mb-8 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
            <div>
                 <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-5 h-5 text-blue-200" />
                    <h3 className="font-bold text-lg tracking-tight">{isTrialExpired ? 'Trial Expired' : 'Upgrade to Pro'}</h3>
                </div>
                <p className="text-blue-200 text-xs font-medium">{isTrialExpired ? 'Subscribe to keep Pro features' : 'Unlock premium analytics & plans'}</p>
            </div>
             <Button size="sm" onClick={openPricing} className="bg-white text-blue-600 hover:bg-slate-50 font-bold border-0 h-10 px-5 rounded-2xl shadow-sm transition-all active:scale-95">
                {isTrialExpired ? 'Subscribe' : hasUsedTrial ? 'Upgrade' : 'Try Free'}
            </Button>
        </div>
    );
};

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { profile, updateProfile } = useProfile(user?.id);
    const { addWeightEntry } = useWeight(user?.id);
    const { openPricing } = usePricing();
    const { subscription, isPremium, isTrialing, isTrialExpired, isCanceled } = useSubscription();

    const hasUsedTrial = false;

    const { convertWeightToDb, displayWeight, formatWeightLabel, preferences, convertHeightToCm, formatHeightValue } = useUserPreferences();

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentWeightInput, setCurrentWeightInput] = useState('');
    const { toast } = useToast();

    // Health Connect State
    const [isConnectingHealth, setIsConnectingHealth] = useState(false);
    const [isHealthConnected, setIsHealthConnected] = useState(() => localStorage.getItem('health_connected') === 'true');

    // Health sync hooks
    const { syncNow, isSyncing, lastSynced, refreshKey } = useHealthSync(user?.id);
    const { metrics: healthMetrics } = useHealthMetrics(user?.id, 1, refreshKey);

    const todayNow = new Date();
    const todayStr = `${todayNow.getFullYear()}-${String(todayNow.getMonth() + 1).padStart(2, '0')}-${String(todayNow.getDate()).padStart(2, '0')}`;
    const todayHealth = healthMetrics?.find(m => m.date === todayStr) || { steps: 0, sleep_hours: 0, active_calories: 0 };

    const getLastSyncedText = () => {
        if (!lastSynced) return null;
        const diff = Date.now() - new Date(lastSynced).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

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

    // Height state
    const [heightVal1, setHeightVal1] = useState('');
    const [heightVal2, setHeightVal2] = useState('');

    // Password Update State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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
            
            if (profile.height) {
                const h = formatHeightValue(profile.height);
                setHeightVal1(h.val1?.toString() || '');
                setHeightVal2(h.val2?.toString() || '');
            }
            setIsDirty(false);
        }
    }, [profile, formatHeightValue, displayWeight]);

    const isFeet = preferences.heightUnit === 'ft';

    const handleSave = async () => {
        setLoading(true);
        try {
            const newGoalWeight = convertWeightToDb(goalWeightInput);
            const newHeight = convertHeightToCm(heightVal1, heightVal2, preferences.heightUnit);

            const validationError = validatePhysicalStats(newGoalWeight, newHeight);
            if (validationError) {
                hapticError();
                toast.error(validationError);
                setLoading(false);
                return;
            }

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
            setIsDirty(false);
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
        } catch (error) {
            hapticError();
            toast.error("Failed to update password");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            hapticMedium();
            const { error } = await supabase.rpc('delete_user_account');
            if (error) throw error;
            
            toast.success("Account permanently deleted");
            await signOut();
        } catch (error) {
            console.error("Delete account error:", error);
            toast.error(error.message || "Failed to delete account");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleWeightLog = async () => {
        if (!currentWeightInput) return;
        try {
            const weightInKg = convertWeightToDb(currentWeightInput);
            
            const validationError = validatePhysicalStats(weightInKg, null);
            if (validationError) {
                hapticError();
                toast.error(validationError);
                return;
            }

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

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

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
        <div className="w-full max-w-md mx-auto p-4 pb-32">
            
            <SubscriptionBanner 
                isPremium={isPremium} 
                isTrialExpired={isTrialExpired} 
                isTrialing={isTrialing} 
                isCanceled={isCanceled}
                subscription={subscription} 
                openPricing={openPricing} 
                hasUsedTrial={hasUsedTrial} 
            />

            {/* Profile Header */}
            <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 border-4 border-white dark:border-zinc-950 shadow-xl shadow-slate-200/50 dark:shadow-none relative">
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        )}
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800">
                                <User className="w-12 h-12" />
                            </div>
                        )}
                    </div>
                    {/* Edit Badge */}
                    <div className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-[3px] border-white dark:border-zinc-950 text-white hover:bg-blue-500 transition-colors active:scale-95">
                        <Pencil className="w-4 h-4 ml-0.5" />
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                </div>
                <div className="mt-5 w-full">
                     <input
                        type="text"
                        value={displayName}
                        onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                        placeholder="Your Name"
                        className="w-full bg-transparent text-center text-3xl font-bold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-700 tracking-tight"
                    />
                </div>
            </div>

            {/* Body Metrics Section */}
            <Section title="Body Metrics" icon={Ruler}>
                <SectionRow label={`Log Today's Weight (${formatWeightLabel()})`}>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            step="0.1"
                            value={currentWeightInput}
                            onChange={(e) => setCurrentWeightInput(e.target.value)}
                            placeholder="0.0"
                            className="w-16 text-right bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                        />
                        <Button size="sm" className="h-8 px-4 rounded-xl text-xs font-bold" onClick={handleWeightLog} disabled={!currentWeightInput}>
                            Log
                        </Button>
                    </div>
                </SectionRow>

                <SectionRow label={`Height (${isFeet ? 'FT / IN' : 'CM'})`}>
                    <div className="flex items-center justify-end gap-1">
                        <input
                             type="number"
                             value={heightVal1}
                             onChange={(e) => { setHeightVal1(e.target.value); setIsDirty(true); }}
                             placeholder={isFeet ? "Ft" : "Cm"}
                             className="w-12 text-right bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                        />
                        {isFeet && (
                            <>
                                <span className="text-slate-400 font-medium">'</span>
                                <input
                                     type="number"
                                     value={heightVal2}
                                     onChange={(e) => { setHeightVal2(e.target.value); setIsDirty(true); }}
                                     placeholder="In"
                                     className="w-12 text-right bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                                />
                                <span className="text-slate-400 font-medium">"</span>
                            </>
                        )}
                    </div>
                </SectionRow>

                <SectionRow label={`Goal Weight (${formatWeightLabel()})`} border={false}>
                    <input
                         type="number"
                         step="0.1"
                         value={goalWeightInput}
                         onChange={(e) => { setGoalWeightInput(e.target.value); setIsDirty(true); }}
                         placeholder="0.0"
                         className="w-20 text-right bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                    />
                </SectionRow>
            </Section>

            {/* Nutrition & Goals Section */}
            <Section title="Nutrition Profile" icon={Utensils}>
                <SectionRow label="Age">
                    <input
                         type="number"
                         value={age}
                         onChange={(e) => { setAge(e.target.value); setIsDirty(true); }}
                         placeholder="Age"
                         className="w-16 text-right bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600"
                    />
                </SectionRow>
                <SectionRow label="Gender">
                    <select
                        value={gender}
                        onChange={(e) => { setGender(e.target.value); setIsDirty(true); }}
                        className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none text-right appearance-none cursor-pointer outline-none pl-4"
                        dir="rtl"
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </SectionRow>
                <SectionRow label="Activity Level">
                    <select
                         value={activityLevel}
                         onChange={(e) => { setActivityLevel(e.target.value); setIsDirty(true); }}
                         className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none text-right appearance-none cursor-pointer outline-none pl-4 max-w-[150px] truncate"
                         dir="rtl"
                    >
                         <option value="sedentary">Sedentary</option>
                         <option value="lightly_active">Lightly Active</option>
                         <option value="moderately_active">Moderately Active</option>
                         <option value="very_active">Very Active</option>
                         <option value="super_active">Super Active</option>
                    </select>
                </SectionRow>
                <SectionRow label="Goal" border={false}>
                    <select
                        value={goalType}
                        onChange={(e) => { setGoalType(e.target.value); setIsDirty(true); }}
                        className="bg-transparent text-slate-900 dark:text-white font-semibold focus:outline-none text-right appearance-none cursor-pointer outline-none pl-4"
                        dir="rtl"
                    >
                         <option value="maintain">Maintain</option>
                         <option value="cut">Cut</option>
                         <option value="bulk">Bulk</option>
                    </select>
                </SectionRow>
            </Section>

            {/* Training Schedule */}
            <Section title="Training Schedule" icon={Calendar}>
                <div className="p-5 flex justify-between items-center gap-1 sm:gap-2">
                    {days.map(day => {
                        const isSelected = workoutDays.includes(day);
                        return (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`w-10 h-10 flex items-center justify-center text-sm rounded-full transition-all font-bold active:scale-90 ${isSelected
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-500 hover:text-slate-900 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {day.slice(0, 1)}
                            </button>
                        );
                    })}
                </div>
            </Section>

            {/* Health Sync Card */}
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-[12px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-widest mb-2.5 flex items-center gap-2 px-2">
                    <Activity className="w-3.5 h-3.5" /> Health & Device Sync
                </h2>
                <div className={`relative overflow-hidden rounded-3xl border ${isHealthConnected
                        ? 'border-emerald-500/30 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-teal-950/30 shadow-xl shadow-emerald-500/5'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm'
                    }`}>
                    {isHealthConnected && (
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
                    )}

                    <div className="relative p-5 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHealthConnected
                                        ? 'bg-emerald-500/20 text-emerald-500'
                                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                    }`}>
                                    {isHealthConnected ? <Activity className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Health Connect</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {isHealthConnected ? (
                                            <>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[12px] text-emerald-600 dark:text-emerald-400 font-semibold">Connected</span>
                                                {getLastSyncedText() && (
                                                    <span className="text-[11px] text-zinc-500 ml-1 font-medium">· {getLastSyncedText()}</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <WifiOff className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                                                <span className="text-[12px] text-slate-500 dark:text-zinc-500 font-medium">Not connected</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isHealthConnected ? (
                            <>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-white dark:bg-zinc-950/50 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 text-center shadow-sm">
                                        <Footprints className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                                        <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{todayHealth.steps.toLocaleString()}</p>
                                        <p className="text-[11px] font-medium text-slate-500">Steps</p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-950/50 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 text-center shadow-sm">
                                        <Moon className="w-5 h-5 text-indigo-500 mx-auto mb-1.5" />
                                        <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{todayHealth.sleep_hours}h</p>
                                        <p className="text-[11px] font-medium text-slate-500">Sleep</p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-950/50 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 text-center shadow-sm">
                                        <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1.5" />
                                        <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{todayHealth.active_calories}</p>
                                        <p className="text-[11px] font-medium text-slate-500">Calories</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        size="sm"
                                        className="flex-1 h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl border-0 shadow-md shadow-emerald-500/20 active:scale-95"
                                        disabled={isSyncing}
                                        onClick={() => {
                                            hapticLight();
                                            syncNow();
                                        }}
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-11 px-5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                                        onClick={() => {
                                            setIsHealthConnected(false);
                                            localStorage.removeItem('health_connected');
                                            localStorage.removeItem('health_last_synced');
                                            toast.success("Disconnected. Please revoke permissions in settings.");
                                            hapticMedium();
                                            openHealthSettings();
                                        }}
                                    >
                                        Disconnect
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-[13px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                                    Connect to Google Health Connect or Apple HealthKit to automatically track your steps, sleep, and calories.
                                </p>
                                <Button
                                    className="w-full h-12 text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95"
                                    disabled={isConnectingHealth}
                                    onClick={async () => {
                                        setIsConnectingHealth(true);
                                        hapticLight();
                                        try {
                                            const success = await requestHealthPermissions();
                                            if (success === true) {
                                                setIsHealthConnected(true);
                                                localStorage.setItem('health_connected', 'true');
                                                toast.success("Health sync activated!");
                                                hapticSuccess();
                                                syncNow();
                                            } else {
                                                toast.error("Failed: Ensure Health Connect is installed");
                                                hapticError();
                                            }
                                        } catch (err) {
                                            toast.error("Error: " + err.message);
                                            hapticError();
                                        } finally {
                                            setIsConnectingHealth(false);
                                        }
                                    }}
                                >
                                    {isConnectingHealth ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Smartphone className="w-5 h-5 mr-2" />
                                            Connect Health Data
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Section */}
            <Section title="Security" icon={KeyRound}>
                <div className="p-5 space-y-4">
                    <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password"
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors"
                    />
                    <PasswordInput
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         placeholder="Confirm Password"
                         className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-zinc-600 transition-colors"
                    />
                    <Button
                         size="sm"
                         onClick={handlePasswordUpdate}
                         disabled={passwordLoading || !newPassword || !confirmPassword}
                         className="w-full h-12 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-slate-100"
                    >
                         {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                         Update Password
                    </Button>
                </div>
            </Section>

            {/* Account Management */}
            <Section title="Account" icon={User}>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    <button
                        onClick={handleSignOut}
                        className="w-full p-4 text-[15px] font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2 text-center"
                    >
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                    
                    {showDeleteConfirm ? (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3 text-center">
                                Are you sure? This will permanently delete your account, workouts, and subscriptions. This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900/50 text-slate-700 dark:text-zinc-300"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Yes, Delete
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                hapticMedium();
                                setShowDeleteConfirm(true);
                            }}
                            className="w-full p-4 text-[15px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center text-center"
                        >
                            Delete Account
                        </button>
                    )}
                </div>
            </Section>

            {/* Floating Save Button */}
            <AnimatePresence>
                {isDirty && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-[80px] left-0 right-0 px-4 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-md pointer-events-auto">
                            <Button
                                onClick={handleSave}
                                className="w-full h-14 text-lg font-bold rounded-full shadow-2xl shadow-blue-500/40 bg-blue-600 hover:bg-blue-500 text-white border-[3px] border-white dark:border-zinc-900 active:scale-95 transition-all"
                                disabled={loading || uploading}
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : null}
                                {loading ? 'Saving...' : 'Save Profile Changes'}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
