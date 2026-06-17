import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Calendar, Camera, Loader2, KeyRound, ChevronDown, ChevronUp, Crown, ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useSubscription } from '../hooks/useSubscription';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { PasswordInput } from '../components/ui/PasswordInput';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticLight, hapticSuccess, hapticError, hapticMedium } from '../lib/haptics';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { profile, updateProfile } = useProfile(user?.id);
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
    const { toast } = useToast();

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [goalWeightInput, setGoalWeightInput] = useState('');
    const [workoutDays, setWorkoutDays] = useState([]);
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
            setIsDirty(false);
        }
    }, [profile]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const newGoalWeight = convertWeightToDb(goalWeightInput);
            
            await updateProfile({
                display_name: displayName,
                avatar_url: avatarUrl,
                goal_weight: newGoalWeight,
                workout_days: workoutDays
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
            <div className="flex flex-col items-center gap-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                {/* Avatar */}
                <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-md group-hover:border-zinc-500 transition-colors relative">
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                        )}
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800">
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
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block text-center">
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                        placeholder="Your Name"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                    />
                </div>
            </div>

            {/* Goal Weight */}
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
                    Goal Weight ({formatWeightLabel()})
                </label>
                <input
                    type="number"
                    step="0.1"
                    value={goalWeightInput}
                    onChange={(e) => { setGoalWeightInput(e.target.value); setIsDirty(true); }}
                    placeholder="e.g. 180"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                />
            </div>

            {/* Workout Days */}
            <div className="bg-zinc-900/50 p-5 rounded-2xl border border-zinc-800">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Weekly Schedule
                </label>
                <div className="flex flex-wrap gap-2">
                    {days.map(day => {
                        const isSelected = workoutDays.includes(day);
                        return (
                            <button
                                key={day}
                                onClick={() => toggleDay(day)}
                                className={`flex-1 min-w-[40px] py-2.5 text-xs rounded-xl border transition-all font-medium ${isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900'
                                    }`}
                            >
                                {day.slice(0, 3)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Subscription Plan Section */}
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-400' : 'text-zinc-500'}`} />
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Current Plan</h3>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isTrialExpired
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : isPremium
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
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
                                <span>Upgrade to unlock premium</span>
                            ) : (
                                <span>Start your 14-day free trial</span>
                            )}
                        </div>

                        {isPremium && !isTrialExpired ? (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-9 px-4 text-xs gap-1.5 rounded-xl border-zinc-700"
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
            <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/50">
                <button
                    onClick={() => setPasswordOpen(!passwordOpen)}
                    className="w-full flex items-center justify-between p-5 text-xs font-bold text-zinc-400 hover:text-zinc-300 uppercase tracking-wider transition-colors"
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
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                />
                                <PasswordInput
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
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
