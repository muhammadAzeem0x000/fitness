import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Dumbbell, Loader2, KeyRound, ArrowLeft } from 'lucide-react';

export function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [view, setView] = useState('login'); // 'login' or 'forgot-password'

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(error.message);
        }
        setLoading(false);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            alert(error.message);
        } else {
            alert('Check your email for the login link!');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            alert('Password reset link sent to your email!');
            setView('login');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                        {view === 'login' ? (
                            <Dumbbell className="h-6 w-6 text-blue-500" />
                        ) : (
                            <KeyRound className="h-6 w-6 text-blue-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl">
                        {view === 'login' ? 'Welcome Back' : 'Reset Password'}
                    </CardTitle>
                    <p className="text-sm text-zinc-400">
                        {view === 'login'
                            ? 'Enter your email to sign in to your dashboard'
                            : 'Enter your email to receive a password reset link'
                        }
                    </p>
                </CardHeader>
                <CardContent>
                    {view === 'login' ? (
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    required={true}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    required={true}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setView('forgot-password')}
                                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={handleSignUp}
                                    disabled={loading}
                                >
                                    Sign Up
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-4" onSubmit={handleResetPassword}>
                            <div className="space-y-2">
                                <input
                                    className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="email"
                                    placeholder="Email address"
                                    value={email}
                                    required={true}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                type="button"
                                onClick={() => setView('login')}
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
