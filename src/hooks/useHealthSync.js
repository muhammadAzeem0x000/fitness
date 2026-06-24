import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchDailyHealthData } from '../lib/wearables';
import { isNativePlatform } from '../lib/platform';

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const LAST_SYNCED_KEY = 'health_last_synced';

/**
 * Builds a local YYYY-MM-DD date string (avoids UTC timezone mismatch).
 */
const getLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Syncs health data from the device to Supabase.
 * Now supports:
 * - Periodic auto-sync every 15 minutes
 * - Instant sync on app resume (foreground)
 * - Manual sync via returned `syncNow` function
 * - Returns `refreshKey` that increments on each successful sync so downstream
 *   hooks can re-fetch.
 */
export const useHealthSync = (userId) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState(
        () => localStorage.getItem(LAST_SYNCED_KEY) || null
    );
    const intervalRef = useRef(null);
    const resumeListenerRef = useRef(null);

    const performSync = useCallback(async () => {
        if (!userId) return;
        const isConnected = localStorage.getItem('health_connected') === 'true';
        if (!isConnected) return;

        setIsSyncing(true);
        try {
            const data = await fetchDailyHealthData();
            const dateStr = getLocalDateStr();

            const { error } = await supabase
                .from('daily_health_metrics')
                .upsert({
                    user_id: userId,
                    date: dateStr,
                    steps: data.steps || 0,
                    sleep_hours: data.sleepHours || 0,
                    active_calories: data.activeEnergy || 0,
                    synced_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id, date'
                });

            if (error) {
                console.error('Failed to sync daily health metrics:', error.message);
            } else {
                console.log('Health data synced for', dateStr, data);
                const now = new Date().toISOString();
                setLastSynced(now);
                localStorage.setItem(LAST_SYNCED_KEY, now);
                // Increment refresh key so useHealthMetrics re-fetches
                setRefreshKey(prev => prev + 1);
            }
        } catch (err) {
            console.error('Health sync error:', err);
        } finally {
            setIsSyncing(false);
        }
    }, [userId]);

    // Initial sync + periodic interval
    useEffect(() => {
        if (!userId) return;

        // Sync immediately on mount
        performSync();

        // Set up periodic sync every 15 minutes
        intervalRef.current = setInterval(performSync, SYNC_INTERVAL_MS);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [userId, performSync]);

    // App resume listener (Capacitor)
    useEffect(() => {
        if (!userId || !isNativePlatform()) return;

        let cleanup = null;

        const setupResumeListener = async () => {
            try {
                const { App } = await import('@capacitor/app');
                const listener = await App.addListener('appStateChange', ({ isActive }) => {
                    if (isActive) {
                        console.log('App resumed — syncing health data');
                        performSync();
                    }
                });
                resumeListenerRef.current = listener;
                cleanup = () => {
                    if (resumeListenerRef.current) {
                        resumeListenerRef.current.remove();
                        resumeListenerRef.current = null;
                    }
                };
            } catch (err) {
                console.warn('Could not set up app resume listener:', err);
            }
        };

        setupResumeListener();

        return () => {
            if (cleanup) cleanup();
        };
    }, [userId, performSync]);

    return {
        syncNow: performSync,
        isSyncing,
        lastSynced,
        refreshKey
    };
};
