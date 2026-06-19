import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Dumbbell, Loader2, KeyRound, ArrowLeft, UserPlus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signupSchema } from '../../lib/schemas';
import { useLocation } from 'react-router-dom';
import { PasswordInput } from '../ui/PasswordInput';

export function Auth() {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState(location.state?.view || 'login'); // 'login' | 'signup' | 'forgot-password'
    const { toast } = useToast();

    // Login Form
    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: loginErrors }
    } = useForm({
        resolver: zodResolver(loginSchema)
    });

    // Signup Form
    const {
        register: registerSignup,
        handleSubmit: handleSubmitSignup,
        formState: { errors: signupErrors }
    } = useForm({
        resolver: zodResolver(signupSchema)
    });

    useEffect(() => {
        if (view === 'login') {
            document.title = 'Login | SmartFit';
        } else if (view === 'signup') {
            document.title = 'Create Account | SmartFit';
        } else if (view === 'forgot-password') {
            document.title = 'Reset Password | SmartFit';
        }
    }, [view]);

    const onLoginSubmit = async (data) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (error) {
            toast.error(error.message);
        }
        setLoading(false);
    };

    const onSignUpSubmit = async (data) => {
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Account created! Please check your email or log in.');
            setView('login');
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        // Keeping simple controlled input for reset password single field or could use form
        const email = e.target.email.value;

        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            toast.success('Password reset link sent to your email!');
            setView('login');
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
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <Card className="w-full max-w-sm border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                        {headerContent.icon}
                    </div>
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">
                        {headerContent.title}
                    </CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {headerContent.subtitle}
                    </p>
                </CardHeader>
                <CardContent>

                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <form className="space-y-4" onSubmit={handleSubmitLogin(onLoginSubmit)}>
                            <div className="space-y-2">
                                <div>
                                    <input
                                        {...registerLogin('email')}
                                        className={`flex h-10 w-full rounded-md border ${loginErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        type="email"
                                        placeholder="Email"
                                    />
                                    {loginErrors.email && <p className="text-xs text-red-500 mt-1">{loginErrors.email.message}</p>}
                                </div>
                                <div>
                                    <PasswordInput
                                        {...registerLogin('password')}
                                        className={`flex h-10 w-full rounded-md border ${loginErrors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        placeholder="Password"
                                    />
                                    {loginErrors.password && <p className="text-xs text-red-500 mt-1">{loginErrors.password.message}</p>}
                                </div>
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
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                            </Button>
                            <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
                                Don't have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setView('signup')}
                                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </form>
                    )}

                    {/* SIGNUP VIEW */}
                    {view === 'signup' && (
                        <form className="space-y-4" onSubmit={handleSubmitSignup(onSignUpSubmit)}>
                            <div className="space-y-2">
                                <div>
                                    <input
                                        {...registerSignup('email')}
                                        className={`flex h-10 w-full rounded-md border ${signupErrors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        type="email"
                                        placeholder="Email"
                                    />
                                    {signupErrors.email && <p className="text-xs text-red-500 mt-1">{signupErrors.email.message}</p>}
                                </div>
                                <div>
                                    <PasswordInput
                                        {...registerSignup('password')}
                                        className={`flex h-10 w-full rounded-md border ${signupErrors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        placeholder="Password (min 6 chars)"
                                    />
                                    {signupErrors.password && <p className="text-xs text-red-500 mt-1">{signupErrors.password.message}</p>}
                                </div>
                                <div>
                                    <PasswordInput
                                        {...registerSignup('confirmPassword')}
                                        className={`flex h-10 w-full rounded-md border ${signupErrors.confirmPassword ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        placeholder="Confirm Password"
                                    />
                                    {signupErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{signupErrors.confirmPassword.message}</p>}
                                </div>
                            </div>
                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                            </Button>
                            <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
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
                                    name="email"
                                    className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    type="email"
                                    placeholder="Email address"
                                    required
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
                                className="w-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
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
