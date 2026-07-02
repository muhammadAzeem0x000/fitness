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
import authBg from '../../assets/auth-bg.jpg';
import { isNativePlatform } from '../../lib/platform';
import { SocialLogin } from '@capgo/capacitor-social-login';

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

export function Auth() {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState(() => {
        if (location.state?.view) return location.state.view;
        const hasLaunchedBefore = localStorage.getItem('has_launched_before');
        if (!hasLaunchedBefore) {
            localStorage.setItem('has_launched_before', 'true');
            return 'signup';
        }
        return 'login';
    });
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
            document.title = 'Login | MuscleBot';
        } else if (view === 'signup') {
            document.title = 'Create Account | MuscleBot';
        } else if (view === 'forgot-password') {
            document.title = 'Reset Password | MuscleBot';
        }
    }, [view]);

    useEffect(() => {
        if (isNativePlatform()) {
            SocialLogin.initialize({
                google: {
                    webClientId: '85405116052-14s783er0vlucgn6mjckbj6oid8p5hqr.apps.googleusercontent.com',
                }
            }).catch(console.error);
        }
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            if (isNativePlatform()) {
                const result = await SocialLogin.login({
                    provider: 'google',
                    options: {}
                });

                if (result.result.idToken) {
                    const { error } = await supabase.auth.signInWithIdToken({
                        provider: 'google',
                        token: result.result.idToken,
                    });
                    if (error) throw error;
                } else {
                    throw new Error('No ID token found from Google');
                }
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin,
                    }
                });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Google login error:', error);
            toast.error(error.message || 'Failed to login with Google');
        } finally {
            setLoading(false);
        }
    };

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
                    icon: <UserPlus className="h-6 w-6" />,
                    title: 'Create Account',
                    subtitle: 'Sign up to start your fitness journey'
                };
            case 'forgot-password':
                return {
                    icon: <KeyRound className="h-6 w-6" />,
                    title: 'Reset Password',
                    subtitle: 'Enter your email to receive a reset link'
                };
            default: // login
                return {
                    icon: <Dumbbell className="h-6 w-6" />,
                    title: 'Welcome Back',
                    subtitle: 'Enter your email to sign in to your dashboard'
                };
        }
    };

    const headerContent = renderHeader();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 ease-in-out"
                style={{ backgroundImage: `url(${authBg})` }}
            >
                <div className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-sm">

                {/* App Branding Header */}
                <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">MuscleBot</h1>
                    <p className="text-emerald-400 font-medium tracking-widest uppercase text-xs mt-3 drop-shadow">Elite Fitness Tracking</p>
                </div>

                <Card className="border-0 bg-slate-950/70 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-500">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500/30">
                            {headerContent.icon}
                        </div>
                        <CardTitle className="text-2xl text-white font-bold tracking-tight">
                            {headerContent.title}
                        </CardTitle>
                        <p className="text-sm text-slate-300">
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
                                            className={`flex h-10 w-full rounded-md border ${loginErrors.email ? 'border-red-500' : 'border-slate-700/50'} bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors`}
                                            type="email"
                                            placeholder="Email"
                                            autoComplete="email"
                                        />
                                        {loginErrors.email && <p className="text-xs text-red-500 mt-1">{loginErrors.email.message}</p>}
                                    </div>
                                    <div>
                                        <PasswordInput
                                            {...registerLogin('password')}
                                            className={`flex h-10 w-full rounded-md border ${loginErrors.password ? 'border-red-500' : 'border-slate-700/50'} bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors`}
                                            placeholder="Password"
                                            autoComplete="current-password"
                                        />
                                        {loginErrors.password && <p className="text-xs text-red-500 mt-1">{loginErrors.password.message}</p>}
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setView('forgot-password')}
                                            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                                        >
                                            Forgot your password?
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
                                </Button>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-700/50"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-slate-950 px-2 text-slate-400">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-white font-medium shadow-sm transition-all"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <GoogleIcon />
                                    Google
                                </Button>

                                <div className="text-center text-sm text-slate-300 mt-4">
                                    Don't have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setView('signup')}
                                        className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
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
                                            className={`flex h-10 w-full rounded-md border ${signupErrors.email ? 'border-red-500' : 'border-slate-700/50'} bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors`}
                                            type="email"
                                            placeholder="Email"
                                            autoComplete="email"
                                        />
                                        {signupErrors.email && <p className="text-xs text-red-500 mt-1">{signupErrors.email.message}</p>}
                                    </div>
                                    <div>
                                        <PasswordInput
                                            {...registerSignup('password')}
                                            className={`flex h-10 w-full rounded-md border ${signupErrors.password ? 'border-red-500' : 'border-slate-700/50'} bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors`}
                                            placeholder="Password (min 6 chars)"
                                            autoComplete="new-password"
                                        />
                                        {signupErrors.password && <p className="text-xs text-red-500 mt-1">{signupErrors.password.message}</p>}
                                    </div>
                                    <div>
                                        <PasswordInput
                                            {...registerSignup('confirmPassword')}
                                            className={`flex h-10 w-full rounded-md border ${signupErrors.confirmPassword ? 'border-red-500' : 'border-slate-700/50'} bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors`}
                                            placeholder="Confirm Password"
                                            autoComplete="new-password"
                                        />
                                        {signupErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{signupErrors.confirmPassword.message}</p>}
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
                                </Button>
                                <div className="text-center text-xs text-slate-400 mt-2">
                                    By signing up, you agree to our <a href="/terms" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                                </div>

                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-700/50"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-slate-950 px-2 text-slate-400">Or continue with</span>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full bg-slate-900/50 border-slate-700 hover:bg-slate-800 text-white font-medium shadow-sm transition-all"
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                >
                                    <GoogleIcon />
                                    Google
                                </Button>

                                <div className="text-center text-sm text-slate-300 mt-4">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
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
                                        className="flex h-10 w-full rounded-md border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                                        type="email"
                                        placeholder="Email address"
                                        required
                                    />
                                </div>
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/20"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-300 hover:text-white hover:bg-slate-800/50"
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
        </div>
    );
}
