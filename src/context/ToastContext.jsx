import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        console.log("Toast Triggered:", message, type);
        const id = Date.now().toString() + Math.random().toString();
        setToasts((prev) => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <Toaster toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const Toaster = ({ toasts, removeToast }) => {
    // Portal to body to ensure it's always on top
    // Using inline styles to force visibility and z-index, bypassing potential Tailwind conflicts
    return createPortal(
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 2147483647,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '350px',
                width: '100%',
                pointerEvents: 'none' // Allow clicks to pass through container
            }}
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>,
        document.body
    );
};

const ToastItem = ({ toast, onRemove }) => {
    const icons = {
        success: <CheckCircle style={{ width: '20px', height: '20px', color: '#4ade80' }} />, // Green
        error: <AlertCircle style={{ width: '20px', height: '20px', color: '#f87171' }} />,   // Red
        info: <Info style={{ width: '20px', height: '20px', color: '#60a5fa' }} />,           // Blue
    };

    const bgStyles = {
        success: { backgroundColor: '#18181b', borderColor: 'rgba(74, 222, 128, 0.2)' },
        error: { backgroundColor: '#18181b', borderColor: 'rgba(248, 113, 113, 0.2)' },
        info: { backgroundColor: '#18181b', borderColor: 'rgba(96, 165, 250, 0.2)' },
    };

    return (
        <div
            role="alert"
            style={{
                ...bgStyles[toast.type] || bgStyles.info,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                color: 'white',
                pointerEvents: 'auto', // Re-enable clicks for this item
                cursor: 'default',
                animation: 'slideIn 0.3s ease-out' // Simple CSS animation if defined, otherwise just appears
            }}
        >
            <div style={{ marginTop: '2px' }}>{icons[toast.type]}</div>
            <div style={{ flex: 1, fontSize: '14px', fontWeight: '500', wordBreak: 'break-word' }}>
                {toast.message}
            </div>
            <button
                onClick={onRemove}
                style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#a1a1aa'
                }}
            >
                <X style={{ width: '16px', height: '16px' }} />
            </button>
        </div>
    );
};
