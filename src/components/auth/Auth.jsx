import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Dumbbell, Loader2, KeyRound, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot-password'
    const { toast } = useToast();

    // Reset state when switching views
    const switchView = (newView) => {
        setView(newView);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
        } else {
            // Logic handled by Supabase settings:
            // If email confirmation is ON -> User gets email, can't login yet.
            // If email confirmation is OFF -> User is logged in automatically or can login immediately.
            toast.success('Account created! Please check your email or log in.');
            switchView('login');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // Dynamic redirect to current domain (localhost or vercel)
            });
            if (error) throw error;
            toast.success('Password reset link sent to your email!');
            switchView('login');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderHeader = () => {
        switch (view) {
            case 'signup':
                return {
                    icon: <UserPlus className="h-6 w-6 text-blue-500" />,
                    title: 'Create Account',
                    subtitle: 'Sign up to start your fitness journey'
                };
            case 'forgot-password':
                return {
                    icon: <KeyRound className="h-6 w-6 text-blue-500" />,
                    title: 'Reset Password',
                    subtitle: 'Enter your email to receive a reset link'
                };
            default: // login
                return {
                    icon: <Dumbbell className="h-6 w-6 text-blue-500" />,
                    title: 'Welcome Back',
                    subtitle: 'Enter your email to sign in to your dashboard'
                };
        }
    };

    const headerContent = renderHeader();

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
            <Card className="w-full max-w-sm border-slate-800 bg-slate-950">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                        {headerContent.icon}
                    </div>
                    <CardTitle className="text-2xl text-white">
                        {headerContent.title}
                    </CardTitle>
                    <p className="text-sm text-slate-400">
                        {headerContent.subtitle}
                    </p>
                </CardHeader>
                <CardContent>

                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <form className="space-y-4" onSubmit={handleLogin}>
                            <div className="space-y-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => switchView('forgot-password')}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                            </Button>
                            <div className="text-center text-sm text-slate-400 mt-4">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchView('signup')}
                                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    )}

                    {/* SIGNUP VIEW */}
                    {view === 'signup' && (
                        <form className="space-y-4" onSubmit={handleSignUp}>
                            <div className="space-y-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="password"
                                    placeholder="Password (min 6 chars)"
                                    value={password}
                                    required
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    required
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                            </Button>
                            <div className="text-center text-sm text-slate-400 mt-4">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => switchView('login')}
                                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Log In
                                </button>
                            </div>
                        </form>
                    )}

                    {/* FORGOT PASSWORD VIEW */}
                    {view === 'forgot-password' && (
                        <form className="space-y-4" onSubmit={handleResetPassword}>
                            <div className="space-y-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    required
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-white"
                                type="button"
                                onClick={() => switchView('login')}
                                disabled={loading}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                            </Button>
                        </form>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
