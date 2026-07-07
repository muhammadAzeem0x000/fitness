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
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
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

                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Your AI Personal Trainer
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                Build Your Best Physique <br className="hidden lg:block"/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 animate-gradient">
                                    Powered by AI
                                </span>
                            </h1>

                            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                                Stop guessing in the gym. Track your progressive overload, log natural language meals, and get personalized coaching instantly.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-16 duration-1000">
                                <Button onClick={() => navigate('/auth', { state: { view: 'signup' } })} size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-1">
                                    Start for Free <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                                <Button onClick={() => navigate('/auth', { state: { view: 'login' } })} size="lg" variant="secondary" className="w-full sm:w-auto text-lg h-14 px-8 bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700 transition-all hover:-translate-y-1">
                                    <LogIn className="mr-2 w-5 h-5" /> Login
                                </Button>
                            </div>
                        </div>
                        
                        <div className="relative mx-auto w-full max-w-lg lg:max-w-none perspective-1000 animate-in fade-in zoom-in duration-1000 delay-300">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-200 dark:border-white/10 rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
                                <img src="/mock/1. Insights Multi Mode.png" alt="Dashboard Insights" className="w-full h-auto object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 1: Nutrition */}
            <div className="py-24 bg-slate-100/50 dark:bg-slate-900/50">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 relative group">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <img src="/mock/3, Nutrition.png" alt="AI Nutrition" className="relative z-10 w-full max-w-xl mx-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Natural Language Nutrition</h2>
                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Ditch the barcodes. Just type "2 rotis with chicken curry" and our Groq-powered AI instantly calculates your exact macros—calories, protein, carbs, and fats—in milliseconds.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 2: Workout Generator */}
            <div className="py-24 bg-white dark:bg-slate-950">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Elite AI Workout Generation</h2>
                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Powered by DeepSeek, your personal AI trainer builds dynamic, science-backed workout splits based on your exact time constraints, fitness goals, and available equipment.
                            </p>
                        </div>
                        <div className="relative group flex justify-center">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <img src="/mock/4. AI workout generator.png" alt="AI Workout Generator" className="relative z-10 w-full max-w-xl mx-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 hover:scale-105 transition-transform duration-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 3: Analytics */}
            <div className="py-24 bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1 relative flex justify-center items-center gap-6 group py-8">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <img src="/mock/8. Weight and Volume.png" alt="Volume Chart" className="relative z-10 w-[45%] max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 hover:scale-105 hover:z-30 transition-transform duration-500" />
                            <img src="/mock/2. Muscle Headmap.png" alt="Muscle Heatmap" className="relative z-10 w-[45%] max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 hover:scale-105 hover:z-30 transition-transform duration-500 lg:translate-y-12" />
                        </div>
                        <div className="order-1 lg:order-2 lg:pl-12">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500">
                                <Dumbbell className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Deep Analytics & Insights</h2>
                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Visualize your progress like never before. From beautiful volume charts to interactive muscle recovery heatmaps, see exactly how your body is transforming.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature 4: Gamification */}
            <div className="py-24 bg-white dark:bg-slate-950">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-500">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Gamification & Community</h2>
                            <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                                Stay motivated by unlocking badges, tracking your weekly streaks, and climbing the community leaderboard. Fitness is better when we lift together.
                            </p>
                        </div>
                        <div className="relative flex justify-center items-center gap-6 group py-8">
                            <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <img src="/mock/5. Rank.png" alt="Leaderboard Rank" className="relative z-10 w-[45%] max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 hover:scale-105 hover:z-30 transition-transform duration-500" />
                            <img src="/mock/7. Profile.png" alt="Profile Badges" className="relative z-10 w-[45%] max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 hover:scale-105 hover:z-30 transition-transform duration-500 lg:translate-y-12" />
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
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-lg text-slate-900 dark:text-slate-200">MuscleBot</span>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} MuscleBot. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <button onClick={() => navigate('/terms')} className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Terms of Service</button>
                            <button onClick={() => navigate('/privacy')} className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Privacy Policy</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
