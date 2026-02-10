import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import Confetti from 'react-confetti';

export function Success() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { refreshSubscription } = useSubscription();
    const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });

    // Set window dimensions on client side
    useEffect(() => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });
    }, []);

    useEffect(() => {
        // Verify the checkout session and update subscription status
        const verifyCheckout = async () => {
            if (!sessionId) return;

            try {
                const { data: { session: authSession } } = await supabase.auth.refreshSession();
                if (!authSession) return;

                // Call edge function to verify the checkout session and update DB
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-session`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${authSession.access_token}`,
                            'Content-Type': 'application/json',
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({ sessionId })
                    }
                );

                const data = await response.json();
                console.log('🔵 verify-session response status:', response.status);
                console.log('🔵 verify-session response data:', data);

                if (!response.ok) {
                    console.error('❌ verify-session failed:', data);
                }

                // Refresh subscription cache
                refreshSubscription();
            } catch (err) {
                console.error('❌ Failed to verify session:', err);
                // Still refresh as fallback
                refreshSubscription();
            }
        };

        verifyCheckout();
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
            <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.3}
            />

            <div className="max-w-2xl w-full text-center">
                {/* Success Icon */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 border-2 border-green-500/50 flex items-center justify-center animate-in zoom-in duration-500">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                </div>

                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-in slide-in-from-bottom-4 duration-700">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">SmartFit Pro</span>!
                </h1>

                {/* Description */}
                <p className="text-xl text-zinc-400 mb-8 max-w-lg mx-auto animate-in slide-in-from-bottom-8 duration-700">
                    Your subscription is now active. Enjoy unlimited AI coaching, advanced analytics, and all premium features!
                </p>

                {/* Benefits */}
                <div className="bg-slate-900 border border-zinc-800 rounded-xl p-6 mb-8 max-w-md mx-auto animate-in slide-in-from-bottom-12 duration-700">
                    <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-5 h-5 text-blue-400" />
                        <h3 className="font-semibold">Your 7-Day Free Trial Started</h3>
                    </div>
                    <ul className="text-sm text-zinc-400 space-y-2 text-left">
                        <li>✅ Full access to all Pro features</li>
                        <li>✅ Cancel anytime during trial</li>
                        <li>✅ First charge on {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                    </ul>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom-16 duration-700">
                    <Button
                        size="lg"
                        onClick={() => navigate('/dashboard')}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => navigate('/ai-coach')}
                    >
                        Try AI Coach Now
                    </Button>
                </div>

                {/* Session ID for debugging */}
                {sessionId && (
                    <p className="text-xs text-zinc-600 mt-8">
                        Session ID: {sessionId}
                    </p>
                )}
            </div>
        </div>
    );
}
