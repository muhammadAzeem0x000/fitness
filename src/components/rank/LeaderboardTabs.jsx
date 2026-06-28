import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Trophy, Medal, Crown, Dumbbell, Calendar, Flame } from 'lucide-react';

export function LeaderboardTabs({ onCurrentRankUpdate }) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('volume'); // volume, consistency, streak
    const [timeFilter, setTimeFilter] = useState('month'); // week, month, all
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const TABS = [
        { id: 'volume', label: 'Volume', icon: Dumbbell, rpc: 'get_top_users' },
        { id: 'consistency', label: 'Workouts', icon: Calendar, rpc: 'get_most_consistent_users' },
        { id: 'streak', label: 'Streaks', icon: Flame, rpc: 'get_top_streaks', hideTimeFilter: true }
    ];

    const TIME_FILTERS = [
        { id: 'week', label: 'This Week' },
        { id: 'month', label: 'This Month' },
        { id: 'all', label: 'All Time' }
    ];

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const currentTab = TABS.find(t => t.id === activeTab);
                
                // For streak, we don't pass time filter
                const params = currentTab.hideTimeFilter ? undefined : { time_filter: timeFilter };
                
                const { data, error } = await supabase.rpc(currentTab.rpc, params);
                
                if (error) throw error;
                
                const formattedData = (data || []).map(row => ({
                    id: row.user_id,
                    name: row.display_name,
                    avatarUrl: row.avatar_url,
                    value: row.total_volume || row.workout_count || row.current_streak || 0,
                    isCurrentUser: row.user_id === user?.id
                }));
                
                setLeaderboardData(formattedData);

                // Update current user rank if we are on Volume and Month (default view)
                if (activeTab === 'volume' && timeFilter === 'month') {
                    const myRank = formattedData.findIndex(u => u.isCurrentUser);
                    onCurrentRankUpdate(myRank >= 0 ? myRank + 1 : null);
                }

            } catch (err) {
                console.error('Leaderboard fetch error:', err);
                setLeaderboardData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [activeTab, timeFilter, user?.id]);

    const activeTabConfig = TABS.find(t => t.id === activeTab);

    const getRankIcon = (index) => {
        if (index === 0) return <Crown className="w-5 h-5 text-yellow-500 drop-shadow-sm" />;
        if (index === 1) return <Medal className="w-5 h-5 text-slate-300 drop-shadow-sm" />;
        if (index === 2) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-sm" />;
        return <span className="text-slate-500 dark:text-zinc-500 font-bold w-5 text-center">{index + 1}</span>;
    };

    const formatValue = (value) => {
        if (activeTab === 'volume') {
            return (
                <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{(value / 1000).toFixed(1)}k</span>
                    <span className="text-[10px] text-slate-500 ml-1 uppercase tracking-wider">lbs</span>
                </div>
            );
        }
        if (activeTab === 'consistency') {
            return (
                <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{value}</span>
                    <span className="text-[10px] text-slate-500 ml-1 uppercase tracking-wider">workouts</span>
                </div>
            );
        }
        if (activeTab === 'streak') {
            return (
                <div className="text-right flex items-center gap-1 justify-end text-orange-500">
                    <span className="font-bold">{value}</span>
                    <Flame className="w-4 h-4" />
                </div>
            );
        }
    };

    return (
        <div className="mb-8">
            {/* Main Tabs */}
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl mb-4">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isActive ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300'}`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : ''}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Time Filters */}
            {!activeTabConfig.hideTimeFilter && (
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {TIME_FILTERS.map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setTimeFilter(filter.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${timeFilter === filter.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Leaderboard List */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden relative min-h-[300px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[2px] z-10">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-medium">Updating rankings...</p>
                    </div>
                ) : leaderboardData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Trophy className="w-12 h-12 text-slate-300 dark:text-zinc-700 mb-3" />
                        <p>No activity found for this period.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                        {leaderboardData.map((row, index) => (
                            <div 
                                key={row.id} 
                                className={`flex items-center p-4 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 animate-in fade-in slide-in-from-bottom-2 duration-300 ${row.isCurrentUser ? 'bg-blue-50/50 dark:bg-blue-900/10 relative overflow-hidden' : ''}`}
                                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                            >
                                {row.isCurrentUser && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                )}
                                
                                <div className="w-8 flex justify-center mr-3 shrink-0">
                                    {getRankIcon(index)}
                                </div>
                                
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                                    {row.avatarUrl ? (
                                        <img src={row.avatarUrl} alt={row.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-slate-400 text-sm font-bold">{row.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                
                                <div className="ml-3 flex-1 min-w-0">
                                    <h3 className={`text-sm font-bold truncate ${row.isCurrentUser ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                                        {row.name} {row.isCurrentUser && '(You)'}
                                    </h3>
                                    {activeTab === 'volume' && (
                                        <p className="text-xs text-slate-500 dark:text-zinc-500">
                                            Level {Math.floor(row.value / 10000) + 1}
                                        </p>
                                    )}
                                </div>
                                
                                {formatValue(row.value)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
