import React from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full text-center shadow-2xl">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 text-red-500 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-slate-400 mb-6 text-sm">
                    {error?.message || "An unexpected error occurred. Please try again."}
                </p>

                <div className="flex gap-3 justify-center">
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Page
                    </Button>
                    {resetErrorBoundary && (
                        <Button onClick={resetErrorBoundary} className="gap-2">
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// For use with react-error-boundary wrapping
export function GlobalErrorFallback({ error, resetErrorBoundary }) {
    return <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
}
