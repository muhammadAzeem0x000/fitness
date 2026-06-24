import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useHealthMetrics = (userId, days = 7, refreshKey = 0) => {
    const [metrics, setMetrics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            try {
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                // Use local date string to avoid UTC timezone mismatch
                const year = cutoff.getFullYear();
                const month = String(cutoff.getMonth() + 1).padStart(2, '0');
                const day = String(cutoff.getDate()).padStart(2, '0');
                const cutoffStr = `${year}-${month}-${day}`;

                const { data, error } = await supabase
                    .from('daily_health_metrics')
                    .select('*')
                    .eq('user_id', userId)
                    .gte('date', cutoffStr)
                    .order('date', { ascending: false });

                if (!error && data) {
                    setMetrics(data);
                }
            } catch (err) {
                console.error("Error fetching health metrics:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, [userId, days, refreshKey]);

    return { metrics, isLoading };
};
