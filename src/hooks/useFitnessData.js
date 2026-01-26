import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK_USER_STATS } from '../data/mockData';
import { useLocalStorage } from './useLocalStorage'; // Keeping for userStats/preferences only

export function useFitnessData() {
    // User Stats (Height - kept in local storage for now as per plan/simplicity)
    const [userStats, setUserStats] = useLocalStorage('fitness_user_stats', MOCK_USER_STATS);

    // State
    const [weightHistory, setWeightHistory] = useState([]);
    const [workoutLogs, setWorkoutLogs] = useState([]);
    const [user, setUser] = useState(null);

    // Auth Listener
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Use Effect to fetch data when user changes
    useEffect(() => {
        if (user) {
            fetchWeightHistory();
            fetchWorkoutLogs();
        } else {
            setWeightHistory([]);
            setWorkoutLogs([]);
        }
    }, [user]);

    // Fetchers
    const fetchWeightHistory = async () => {
        const { data, error } = await supabase
            .from('weight_history')
            .select('*')
            .order('date', { ascending: true });

        if (error) console.error('Error fetching weight:', error);
        if (data) setWeightHistory(data);
    };

    const fetchWorkoutLogs = async () => {
        const { data, error } = await supabase
            .from('workout_logs')
            .select('*')
            .order('date', { ascending: false });

        if (error) console.error('Error fetching logs:', error);
        if (data) setWorkoutLogs(data);
    };

    // Computed: BMI
    const calculateBMI = (weight, heightCm) => {
        if (!weight || !heightCm) return 0;
        const heightM = heightCm / 100;
        return (weight / (heightM * heightM)).toFixed(1);
    };

    const currentBMI = calculateBMI(
        weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : userStats.currentWeight,
        userStats.height
    );

    // Actions
    const addWeightEntry = async (weight) => {
        if (!user) return; // Guard clause

        const today = new Date().toISOString().split('T')[0];
        const newWeight = parseFloat(weight);

        // Optimistic Update
        const newEntry = { date: today, weight: newWeight, user_id: user.id };

        // Check if we need to update existing entry for today or insert new
        // For simplicity with Supabase, we can just Insert and if logic requires unique per day constraints we handle it.
        // Let's just INSERT for now.

        const { error } = await supabase
            .from('weight_history')
            .insert({ weight: newWeight, date: today, user_id: user.id });

        if (error) {
            console.error("Error adding weight:", error);
            alert("Failed to save weight");
        } else {
            fetchWeightHistory(); // Refresh
            // Update local stats
            setUserStats(prev => ({ ...prev, currentWeight: newWeight }));
        }
    };

    const addWorkoutLog = async (workoutData) => {
        if (!user) return;

        const { type, exercises, timestamp } = workoutData;

        const { error } = await supabase
            .from('workout_logs')
            .insert({
                user_id: user.id,
                type,
                exercises, // JSONB
                date: timestamp
            });

        if (error) {
            console.error("Error logging workout:", error);
            alert("Failed to save workout");
        } else {
            fetchWorkoutLogs();
        }
    };

    const updateHeight = (newHeightCm) => {
        setUserStats(prev => ({ ...prev, height: parseFloat(newHeightCm) }));
    };

    return {
        userStats,
        weightHistory,
        workoutLogs,
        currentBMI,
        addWeightEntry,
        addWorkoutLog,
        updateHeight,
        user // Export user if needed by consumers
    };
}
