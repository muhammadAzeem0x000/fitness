import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Upload, LogOut, User, Check, Calendar, Camera, Loader2, KeyRound, ChevronDown, ChevronUp, Crown, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useWeight } from '../../hooks/useWeight';
import { useSubscription } from '../../hooks/useSubscription';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { PasswordInput } from '../ui/PasswordInput';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useBackInterceptor } from '../../hooks/useHardwareBackButton';

export function UserProfileDialog({ isOpen, onClose }) {
    useBackInterceptor(() => {
        onClose();
    }, isOpen);
    const { user, signOut } = useAuth();
    const { profile, updateProfile } = useProfile(user?.id);
    const { addWeightEntry } = useWeight(user?.id);
    const { subscription, isPremium, isTrialing, isTrialExpired, isCanceled } = useSubscription();
    
    const hasUsedTrial = isTrialExpired ||
        subscription?.status === 'canceled' ||
        subscription?.status === 'past_due' ||
        subscription?.status === 'active' ||
        !!subscription?.stripe_subscription_id;

    const { preferences, convertWeightToDb, displayWeight, formatWeightLabel, convertHeightToCm, formatHeightValue } = useUserPreferences();
    const isFeet = preferences.heightUnit === 'ft';

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [goalWeightInput, setGoalWeightInput] = useState('');
    const [currentWeightInput, setCurrentWeightInput] = useState('');
    const [heightVal1, setHeightVal1] = useState('');
    const [heightVal2, setHeightVal2] = useState('');
    const [workoutDays, setWorkoutDays] = useState([]);
    const [isDirty, setIsDirty] = useState(false);
    const fileInputRef = useRef(null);

    // Password Update State
    const [passwordOpen, setPasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Sync with profile when opening
    useEffect(() => {
        if (isOpen && profile) {
            setDisplayName(profile.display_name || '');
            setAvatarUrl(profile.avatar_url || '');
            setGoalWeightInput(profile.goal_weight ? displayWeight(profile.goal_weight) : '');
            setWorkoutDays(profile.workout_days || []);
            
            if (profile.height) {
                const h = formatHeightValue(profile.height);
                setHeightVal1(h.val1?.toString() || '');
                setHeightVal2(h.val2?.toString() || '');
            } else {
                setHeightVal1('');
                setHeightVal2('');
            }

            setIsDirty(false);
            // Reset password fields
            setPasswordOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [isOpen, profile, formatHeightValue]);

    // Handle Closing
    if (!isOpen) return null;

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
                workout_days: workoutDays
            });
            toast.success("Profile updated successfully!");
            onClose();
        } catch (error) {
            console.error("Failed to save profile", error);
            toast.error("Failed to save profile changes.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
            setPasswordOpen(false);
        } catch (error) {
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
            toast.success("Weight logged successfully!");
            setCurrentWeightInput('');
        } catch (error) {
            toast.error("Failed to log weight.");
        }
    };

    const handleSignOut = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        try {
            console.log("Signing out...");
            setLoading(true);

            // 1. Try official sign out
            await signOut();

            // 2. FORCE clear local storage (Supabase sometimes lingers)
            localStorage.removeItem('sb-hvjchdgthkxqdvxrjero-auth-token');
            localStorage.removeItem('supabase.auth.token');

            console.log("Sign out successful");
        } catch (error) {
            console.error("Error signing out:", error);
            // Fallback clear
            localStorage.removeItem('sb-hvjchdgthkxqdvxrjero-auth-token');
        } finally {
            // 3. Force hard redirect
            window.location.href = '/';
        }
    };

    const toggleDay = (day) => {
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

    // Use Portal to escape parent stacking contexts
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content - Constrained Height */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="w-full max-w-sm w-[90%] transform rounded-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl ring-1 ring-white/10 relative flex flex-col max-h-[85vh]"
                    >

                        {/* Header */}
                        <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 flex items-center justify-between shrink-0 rounded-t-2xl">
                            <h2 className="text-lg font-bold text-white tracking-tight">Edit Profile</h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-4 space-y-5 overflow-y-auto custom-scrollbar">

                            {/* Top Section: Avatar + Name Side-by-Side */}
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-md group-hover:border-zinc-500 transition-colors relative">
                                        {uploading && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                            </div>
                                        )}
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800">
                                                <User className="w-8 h-8" />
                                            </div>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <Camera className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                                </div>

                                {/* Inputs Column */}
                                <div className="flex-1 flex flex-col gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                                            placeholder="Your Name"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                                            Goal Weight ({formatWeightLabel()})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={goalWeightInput}
                                            onChange={(e) => { setGoalWeightInput(e.target.value); setIsDirty(true); }}
                                            placeholder="e.g. 180"
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Body Metrics Update Section */}
                            <div className="bg-zinc-950/30 border border-zinc-800 rounded-lg p-3 space-y-3">
                                {/* Current Weight Log */}
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                                        Log Today's Weight ({formatWeightLabel()})
                                    </label>
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={currentWeightInput}
                                            onChange={(e) => setCurrentWeightInput(e.target.value)}
                                            placeholder={`e.g. 180`}
                                            className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                        />
                                        <Button size="sm" className="px-4 text-xs" onClick={handleWeightLog}>
                                            Log
                                        </Button>
                                    </div>
                                </div>

                                {/* Height Update */}
                                <div className="pt-2 border-t border-zinc-800/50">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">
                                        Height ({isFeet ? 'FT / IN' : 'CM'})
                                    </label>
                                    <div className={`grid gap-2 w-full ${isFeet ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        <input
                                            type="number"
                                            value={heightVal1}
                                            onChange={(e) => { setHeightVal1(e.target.value); setIsDirty(true); }}
                                            placeholder={isFeet ? "Ft" : "Cm"}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                        />
                                        {isFeet && (
                                            <input
                                                type="number"
                                                value={heightVal2}
                                                onChange={(e) => { setHeightVal2(e.target.value); setIsDirty(true); }}
                                                placeholder="In"
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Change Password Section (Collapsible) */}
                            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/30">
                                <button
                                    onClick={() => setPasswordOpen(!passwordOpen)}
                                    className="w-full flex items-center justify-between p-2.5 text-[10px] font-bold text-zinc-400 hover:text-zinc-300 uppercase tracking-wider transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <KeyRound className="w-3.5 h-3.5" /> Change Password
                                    </span>
                                    {passwordOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                <AnimatePresence>
                                    {passwordOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 pt-0 space-y-2">
                                                <PasswordInput
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="New Password"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                                />
                                                <PasswordInput
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    placeholder="Confirm"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={handlePasswordUpdate}
                                                    disabled={passwordLoading || !newPassword || !confirmPassword}
                                                    className="w-full h-8 text-xs"
                                                >
                                                    {passwordLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                                    Update
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Subscription Plan Section */}
                            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/30">
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-400' : 'text-zinc-500'}`} />
                                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Current Plan</h3>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isTrialExpired
                                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            : isPremium
                                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                            }`}>
                                            {isTrialExpired ? 'Trial Expired' : isTrialing ? 'Free Trial' : isPremium ? (subscription?.plan_id === (import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_1TfEnwESf91DrGyE4XWhZzVs') ? 'Pro Yearly' : 'Pro Monthly') : 'Free'}
                                        </span>
                                    </div>

                                    {isTrialExpired && (
                                        <div className="mb-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <p className="text-xs text-red-400 font-medium">Your free trial has ended. Subscribe now to keep using Pro features.</p>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-zinc-400">
                                            {isCanceled ? (
                                                <span className="text-red-400">Canceled (Expires {new Date(subscription?.current_period_end).toLocaleDateString()})</span>
                                            ) : isTrialExpired ? (
                                                <span className="text-red-400">Expired on {new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                                            ) : isTrialing ? (
                                                <span className="text-blue-400">Trial ends {new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                                            ) : isPremium ? (
                                                <span>Renews {new Date(subscription?.current_period_end).toLocaleDateString()}</span>
                                            ) : hasUsedTrial ? (
                                                <span>Upgrade to unlock premium features</span>
                                            ) : (
                                                <span>Start your 14-day free trial</span>
                                            )}
                                        </div>

                                        {isPremium && !isTrialExpired ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1.5"
                                                disabled={portalLoading}
                                                onClick={async () => {
                                                    try {
                                                        setPortalLoading(true);
                                                        const { supabase } = await import('../../lib/supabase');

                                                        // Call edge function to get portal URL
                                                        const { data, error } = await supabase.functions.invoke('create-portal-session', {
                                                            body: { customerId: subscription?.stripe_customer_id }
                                                        });

                                                        if (error) throw error;

                                                        // Open in new tab
                                                        if (data?.url) {
                                                            window.open(data.url, '_blank');
                                                        }
                                                    } catch (err) {
                                                        toast.error("Failed to open subscription portal");
                                                        console.error(err);
                                                    } finally {
                                                        setPortalLoading(false);
                                                    }
                                                }}
                                            >
                                                {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                                                Manage
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className={`h-8 text-xs gap-1.5 ${isTrialExpired ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                                                onClick={() => {
                                                    onClose();
                                                    navigate('/pricing');
                                                }}
                                            >
                                                {isTrialExpired ? 'Subscribe Now' : hasUsedTrial ? 'Upgrade to Pro' : 'Start Free Trial'} <Sparkles className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Workout Days */}
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Workout Days
                                </label>
                                <div className="grid grid-cols-7 gap-1">
                                    {days.map(day => {
                                        // day in array is "Monday" etc.
                                        const isSelected = workoutDays.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`py-2 text-[10px] rounded border transition-all font-medium ${isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900'
                                                    }`}
                                            >
                                                {day.slice(0, 1)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>

                        {/* Footer - Compact */}
                        <div className="bg-zinc-900/50 border-t border-zinc-800 p-6 flex flex-col gap-3">
                            <Button
                                onClick={handleSave}
                                className="w-full py-2.5 text-sm"
                                disabled={!isDirty || loading || uploading}
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {loading ? 'Saving Changes...' : 'Save Changes'}
                            </Button>

                            <div className="flex items-center justify-between gap-4 mt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 text-xs text-zinc-500 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex-1 text-xs text-red-600 hover:text-red-400 transition-colors flex items-center justify-end gap-1"
                                >
                                    <LogOut className="w-3 h-3" /> Log Out
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
