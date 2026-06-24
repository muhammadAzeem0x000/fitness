import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Brain, TrendingUp, Check, ArrowRight, UserPlus, LogIn, Laptop, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/50 backdrop-blur-md fixed w-full z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="MuscleBot Logo" className="w-8 h-8 object-cover rounded-full" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                MuscleBot
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/auth', { state: { view: 'login' } })} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                                Login
                            </button>
                            <Button onClick={() => navigate('/auth', { state: { view: 'signup' } })} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition-transform active:scale-95">
                                Get Started
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 rounded-[100%] blur-[120px] -z-10 opacity-50 pointer-events-none animate-pulse" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:bg-blue-500/20 transition-colors cursor-default">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        New: AI-Powered Coaching
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        Transform Your Physique <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient">
                            with Artificial Intelligence
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        Stop guessing in the gym. Track your progressive overload, analyze your weak points, and get personalized coaching insights instantly.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                        <Button onClick={() => navigate('/auth', { state: { view: 'signup' } })} size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-1">
                            Start for Free <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button onClick={() => navigate('/auth', { state: { view: 'login' } })} size="lg" variant="secondary" className="w-full sm:w-auto text-lg h-12 px-8 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-700 dark:hover:border-slate-500 transition-all hover:-translate-y-1">
                            <LogIn className="mr-2 w-5 h-5" /> Login
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-slate-100/50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                <Dumbbell className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Smart Logging</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                                Effortlessly track sets, reps, and weights. Our intelligent logger remembers your history and suggests progressive overload targets.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">AI Coaching</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                                Your personal AI coach analyzes every workout. Get actionable feedback on volume, frequency, and intensity to break through plateaus.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">Visual Progress</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-300 transition-colors">
                                Watch your strength skyrocket with interactive charts. Track volume load, estimated 1RM, and body weight trends over time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Preview Section (New) */}
            <div className="py-24 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Experience the Dashboard</h2>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            A command center for your physique. Analyze detailed stats, manage routines, and chat with your AI coach all in one place.
                        </p>
                    </div>

                    <div className="relative rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl bg-white/50 dark:bg-slate-900/50 overflow-hidden aspect-video md:aspect-[16/9] group">
                        {/* Placeholder for Screenshot */}
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 dark:bg-slate-800/50">
                            <div className="text-center p-8">
                                <Laptop className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Dashboard Screenshot Placeholder</p>
                                <p className="text-slate-500 dark:text-slate-600 text-sm mt-2">Paste your screenshot here</p>
                            </div>
                        </div>
                        {/* Optional overlay effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white/80 dark:from-slate-950/80 to-transparent pointer-events-none" />
                    </div>
                </div>
            </div>


            {/* How It Works */}
            <div className="py-24 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">How It Works</h2>
                        <p className="text-slate-600 dark:text-slate-400">Three simple steps to your best physique.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 z-0" />

                        {/* Step 1 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 shadow-xl flex items-center justify-center text-lg font-bold text-blue-500 mb-6 relative group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-300">
                                1
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Create Profile</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Set your goals and biometrics.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 shadow-xl flex items-center justify-center text-lg font-bold text-blue-500 mb-6 relative group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-300">
                                2
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Log Workouts</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Track your lifts with the intuitive logger.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative z-10 text-center group">
                            <div className="w-16 h-16 mx-auto rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 shadow-xl flex items-center justify-center text-lg font-bold text-blue-500 mb-6 relative group-hover:scale-110 group-hover:border-blue-500/30 transition-all duration-300">
                                3
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Get Insights</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Receive weekly AI reports and growth plans.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-center shadow-2xl shadow-blue-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">
                            Ready to Level Up?
                        </h2>
                        <p className="text-blue-100 max-w-2xl mx-auto mb-10 text-lg relative z-10">
                            Join thousands of lifters pushing their limits with MuscleBot. It's free to start.
                        </p>
                        <div className="relative z-10">
                            <Button onClick={() => navigate('/auth', { state: { view: 'signup' } })} size="lg" className="bg-white text-blue-600 hover:bg-blue-50 border-none">
                                <UserPlus className="w-5 h-5 mr-2" /> Create Free Account
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-lg text-slate-900 dark:text-slate-200">MuscleBot</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} MuscleBot. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
