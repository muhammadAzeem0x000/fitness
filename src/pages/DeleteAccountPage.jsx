import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function DeleteAccountPage() {
    const navigate = useNavigate();
    const supportEmail = "support@musclebot.app";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden relative">
                
                {/* Header Pattern */}
                <div className="absolute inset-0 h-32 bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/5 dark:to-orange-500/5" />
                
                <div className="relative p-8 text-center border-b border-slate-100 dark:border-white/5">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mb-2">Account Deletion Request</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Learn how to permanently delete your account and all associated fitness data from MuscleBot.
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold">1</span>
                            Delete from within the app
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8 mb-4">
                            The fastest way to instantly delete all your data is directly inside the app. Log in to your account, navigate to the <strong>Profile</strong> tab, scroll to the bottom, and tap <strong>Delete Account</strong>.
                        </p>
                        <div className="pl-8">
                            <Button 
                                onClick={() => navigate('/auth', { state: { view: 'login' } })}
                                className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Log In to Delete Account
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-200 dark:border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-500 uppercase tracking-widest">
                                OR
                            </span>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold">2</span>
                            Email Support
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                            If you no longer have access to the app, you can request manual data deletion. Please send an email to our support team from the email address associated with your MuscleBot account. We will process your deletion request within 7 days.
                        </p>
                        
                        <div className="mt-4 pl-8">
                            <a 
                                href={`mailto:${supportEmail}?subject=Account%20Deletion%20Request`}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                                        {supportEmail}
                                    </span>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 text-center">
                    <button 
                        onClick={() => navigate('/')}
                        className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to Homepage
                    </button>
                </div>
            </div>
        </div>
    );
}
