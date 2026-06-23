import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { fetchDailyHealthData } from '../lib/wearables';

export const useHealthSync = (userId) => {
    const hasSyncedThisSession = useRef(false);

    useEffect(() => {
        const syncHealthData = async () => {
            if (!userId) return;
            if (hasSyncedThisSession.current) return;
            
            const isConnected = localStorage.getItem('health_connected') === 'true';
            if (!isConnected) return;

            hasSyncedThisSession.current = true;

            try {
                // Fetch from device (or mock on web)
                const data = await fetchDailyHealthData();
                
                // Get local date string for today (YYYY-MM-DD)
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                // Upsert to Supabase
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
                    console.log('Health data synced for', dateStr);
                }
            } catch (err) {
                console.error('Health sync error:', err);
            }
        };

        syncHealthData();
    }, [userId]);
};
