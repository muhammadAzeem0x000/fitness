import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function useFitnessData() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const { toast } = useToast();

    // Core Data
    const [weightHistory, setWeightHistory] = useState([]);
    const [workoutLogs, setWorkoutLogs] = useState([]);
    const [routines, setRoutines] = useState([]);

    // Auth Listener
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (!session?.user) setLoadingProfile(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setProfile(null);
                setLoadingProfile(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Fetch User Data
    useEffect(() => {
        if (user?.id) {
            fetchProfile();
            fetchWeightHistory();
            fetchWorkoutLogs();
            fetchRoutines();
        }
    }, [user?.id]);

    const fetchProfile = async () => {
        setLoadingProfile(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found" (0 rows)
            console.error('Error fetching profile:', error);
        }

        if (data) {
            setProfile(data);
        } else {
            setProfile(null);
        }
        setLoadingProfile(false);
    };

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

    const fetchRoutines = async () => {
        const { data, error } = await supabase
            .from('routines')
            .select('*')
            .order('id', { ascending: true });

        if (error) console.error('Error fetching routines:', error);
        if (data) setRoutines(data);
    };

    // Computed: BMI
    const calculateBMI = (weight, heightCm) => {
        if (!weight || !heightCm) return 0;
        const heightM = heightCm / 100;
        return (weight / (heightM * heightM)).toFixed(1);
    };

    // Create userStats derivative for compatibility with existing components
    const userStats = {
        height: profile?.height || 0,
        currentWeight: profile?.current_weight || (weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 0),
        goalWeight: profile?.goal_weight || 0
    };

    const currentBMI = calculateBMI(
        weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : userStats.currentWeight,
        userStats.height
    );

    // Actions
    const addWeightEntry = async (weight) => {
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const newWeight = parseFloat(weight);

        // 1. Add to history
        const { error: historyError } = await supabase
            .from('weight_history')
            .insert({ weight: newWeight, date: today, user_id: user.id });

        if (historyError) {
            console.error("Error adding weight:", historyError);
            toast.error("Failed to save weight");
            return;
        }

        // 2. Update profile current_weight
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ current_weight: newWeight, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (profileError) console.error("Error updating profile weight:", profileError);

        fetchWeightHistory();
        fetchProfile();
    };

    const addWorkoutLog = async (workoutData) => {
        if (!user) return;
        const { type, exercises, timestamp } = workoutData;

        const { error } = await supabase
            .from('workout_logs')
            .insert({
                user_id: user.id,
                type,
                exercises,
                date: timestamp
            });

        if (error) {
            console.error("Error logging workout:", error);
            toast.error("Failed to save workout");
        } else {
            fetchWorkoutLogs();
        }
    };

    const updateHeight = async (newHeightCm) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                height: parseFloat(newHeightCm),
                updated_at: new Date().toISOString()
            }); // Upsert ensures if profile doesn't exist (edge case), it creates it.

        if (error) {
            console.error("Error updating height:", error);
        } else {
            fetchProfile();
        }
    };

    const updateProfile = async (updates) => {
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                ...updates,
                updated_at: new Date().toISOString()
            });

        if (error) {
            console.error("Error updating profile:", error);
            throw error;
        } else {
            fetchProfile();
        }
    };

    return {
        user,
        profile,
        loadingProfile,
        userStats,
        weightHistory,
        workoutLogs,
        routines,
        currentBMI,
        addWeightEntry,
        addWorkoutLog,
        updateHeight,
        updateProfile
    };
}
