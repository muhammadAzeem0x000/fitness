import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { loginRevenueCat, logoutRevenueCat } from '../lib/revenuecat';

const AuthContext = createContext({
    user: null,
    loading: true,
    signOut: async () => {},
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted) {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await logoutRevenueCat();
        await supabase.auth.signOut();
    };

    return React.createElement(
        AuthContext.Provider,
        { value: { user, loading, signOut } },
        children
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
