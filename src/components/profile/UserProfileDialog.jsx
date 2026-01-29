import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, LogOut, User, Check, Calendar, Camera, Loader2, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';
import { useFitnessData } from '../../hooks/useFitnessData';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export function UserProfileDialog({ isOpen, onClose }) {
    const { profile, updateProfile } = useFitnessData();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    // Form State
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
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
            setWorkoutDays(profile.workout_days || []);
            setIsDirty(false);
            // Reset password fields
            setPasswordOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [isOpen, profile]);

    // Handle Closing
    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile({
                display_name: displayName,
                avatar_url: avatarUrl,
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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
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

    // Use Portal to escape parent stacking contexts (like Header with backdrop-filter)
    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* Modal Positioning Wrapper */}
            <div className="flex min-h-screen items-center justify-center p-4 text-center">

                {/* Modal Content */}
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-700/50 text-left align-middle shadow-2xl transition-all animate-in zoom-in-95 duration-200 ring-1 ring-white/10 relative">

                    {/* Explicit Close Button - Top Right */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 z-50 p-2 rounded-full bg-black/20 text-zinc-400 hover:bg-black/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Header */}
                    <div className="bg-zinc-900/50 border-b border-zinc-800 p-6 pt-5 pb-4">
                        <h2 className="text-xl font-bold text-white tracking-tight text-center">Edit Profile</h2>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                        {/* Avatar Section - Compact */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700 shadow-xl group-hover:border-zinc-600 transition-colors relative">
                                    {uploading ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        </div>
                                    ) : null}

                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800">
                                            <User className="w-10 h-10" />
                                        </div>
                                    )}

                                    {/* Overlay on Hover */}
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <Camera className="w-6 h-6 text-white mb-1" />
                                        <span className="text-[9px] font-medium text-white uppercase tracking-wider">Change</span>
                                    </div>
                                </div>
                            </div>

                            {/* Very Explicit Upload Text/Button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-2"
                            >
                                <Upload className="w-3 h-3" />
                                Upload Profile Photo
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                                placeholder="E.g. Ace"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-zinc-600"
                            />
                        </div>

                        {/* Change Password Section (Collapsible) */}
                        <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/30">
                            <button
                                onClick={() => setPasswordOpen(!passwordOpen)}
                                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-zinc-400 hover:text-zinc-300 uppercase tracking-wider transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <KeyRound className="w-4 h-4" /> Change Password
                                </span>
                                {passwordOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {passwordOpen && (
                                <div className="p-3 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                    />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handlePasswordUpdate}
                                        disabled={passwordLoading || !newPassword || !confirmPassword}
                                        className="w-full"
                                    >
                                        {passwordLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
                                        Update Password
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Workout Days */}
                        <div>
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Preferred Workout Days
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {days.map(day => {
                                    const isSelected = workoutDays.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => toggleDay(day)}
                                            className={`px-1 py-2 text-[10px] sm:text-xs rounded-lg border transition-all font-medium ${isSelected
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20'
                                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900'
                                                }`}
                                        >
                                            {day.slice(0, 3)}
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
                </div>
            </div>
        </div>,
        document.body
    );
}
