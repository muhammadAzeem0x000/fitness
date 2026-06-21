import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

export function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_top_users');
                
                if (error) {
                    console.error('RPC Error:', error);
                    throw error;
                }
                
                if (data && data.length > 0) {
                    // Map the DB response to the component's expected format
                    const formattedData = data.map((user, index) => ({
                        id: user.user_id,
                        name: user.display_name,
                        volume: Number(user.total_volume) || 0,
                        avatar: user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.display_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-zinc-700 rounded-full text-sm">
                                {user.display_name.charAt(0).toUpperCase()}
                            </div>
                        )
                    }));
                    setLeaderboard(formattedData);
                } else {
                    // Fallback to empty if no users have logged anything
                    setLeaderboard([]);
                }
            } catch (e) {
                console.error('Failed to fetch leaderboard', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
        if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
        return <span className="text-slate-500 font-bold w-5 text-center">{index + 1}</span>;
    };

    return (
        <div className="pt-8 px-4 pb-24 animate-in fade-in duration-500 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Leaderboard</h2>
                    <p className="text-slate-500 dark:text-zinc-400">Global Top 50 • Total Volume (Month)</p>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Loading rankings...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {leaderboard.map((user, index) => (
                            <div 
                                key={user.id} 
                                className={`flex items-center p-4 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${index < 3 ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}
                            >
                                <div className="w-8 flex justify-center mr-3 shrink-0">
                                    {getRankIcon(index)}
                                </div>
                                
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-xl shrink-0">
                                    {user.avatar}
                                </div>
                                
                                <div className="ml-3 flex-1 min-w-0">
                                    <h3 className={`text-sm font-bold truncate ${index < 3 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`}>
                                        {user.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-zinc-500 flex items-center gap-1">
                                        Level {Math.floor(user.volume / 10000) + 1}
                                    </p>
                                </div>
                                
                                <div className="text-right">
                                    <div className="text-sm font-black text-slate-900 dark:text-white">
                                        {(user.volume / 1000).toFixed(1)}k
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        lbs
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100">Keep pushing!</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">You are in the top 45% of users this month. Log 2 more workouts to reach the next tier.</p>
                </div>
            </div>
        </div>
    );
}
