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
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (mounted) {
                if (error) {
                    console.error("Auth session error:", error);
                }
                const sessionUser = session?.user ?? null;
                setUser(sessionUser);
                setLoading(false);
                if (sessionUser) {
                    loginRevenueCat(sessionUser.id).catch(console.error);
                }
            }
        }).catch((err) => {
            console.error("Auth session exception:", err);
            if (mounted) {
                setUser(null);
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                const sessionUser = session?.user ?? null;
                setUser(sessionUser);
                setLoading(false);
                
                if (sessionUser) {
                    loginRevenueCat(sessionUser.id).catch(console.error);
                } else {
                    logoutRevenueCat().catch(console.error);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await logoutRevenueCat();
        } catch (e) {
            console.error(e);
        }
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
