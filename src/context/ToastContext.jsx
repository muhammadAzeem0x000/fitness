import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, XCircle, Info } from 'lucide-react';
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

    const addToast = useCallback((message, type = 'info', duration = 4000, action = null) => {
        const id = Date.now().toString() + Math.random().toString();
        // Remove emoji if it's already in the message (since we use Lucide icons now)
        // This is a quick cleanup in case messages have hardcoded emojis at the start
        const cleanMessage = typeof message === 'string' 
            ? message.replace(/^(\u2705|\u274C|\u2139\uFE0F|\u26A0\uFE0F|\uD83C\uDFDF\uFE0F|\uD83C\uDFC6|\uD83D\uDE80|\uD83D\uDD25)\s*/, '')
            : message;

        setToasts((prev) => [...prev, { id, message: cleanMessage, type, duration, action }]);

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
        success: (message, options = {}) => addToast(message, 'success', options.duration || 4000, options.action),
        error: (message, options = {}) => addToast(message, 'error', options.duration || 4000, options.action),
        info: (message, options = {}) => addToast(message, 'info', options.duration || 4000, options.action),
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <Toaster toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const Toaster = ({ toasts, removeToast }) => {
    return createPortal(
        <div
            style={{
                position: 'fixed',
                bottom: 'max(90px, env(safe-area-inset-bottom, 90px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2147483647,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxWidth: '400px',
                width: 'calc(100% - 32px)',
                pointerEvents: 'none'
            }}
        >
            {toasts.map((toast) => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <Toast {...toast} onClose={() => removeToast(toast.id)} />
                </div>
            ))}
        </div>,
        document.body
    );
};

const Toast = ({ id, message, type, onClose, action }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 200);
    };

    const typeStyles = {
        success: {
            Icon: CheckCircle2,
            iconColor: '#10b981', // emerald-500
        },
        error: {
            Icon: XCircle,
            iconColor: '#ef4444', // red-500
        },
        info: {
            Icon: Info,
            iconColor: '#3b82f6', // blue-500
        },
    };

    const style = typeStyles[type] || typeStyles.info;
    const IconComponent = style.Icon;

    return (
        <div
            style={{
                background: '#18181b', // zinc-900 (Sleek dark theme)
                color: '#f4f4f5', // zinc-50
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid #27272a', // zinc-800
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
                fontWeight: '500',
                minHeight: '48px',
                animation: isExiting ? 'toastSlideOut 0.2s ease-out forwards' : 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transformOrigin: 'bottom center'
            }}
        >
            <IconComponent size={18} color={style.iconColor} style={{ flexShrink: 0 }} />
            
            <span style={{ flex: 1, lineHeight: '1.4' }}>{message}</span>

            {action && (
                <button
                    onClick={() => {
                        action.onClick();
                        handleClose();
                    }}
                    style={{
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        whiteSpace: 'nowrap',
                        marginLeft: '4px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#3f3f46';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = '#27272a';
                    }}
                >
                    {action.label}
                </button>
            )}

            <button
                onClick={handleClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa', // zinc-400
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'color 0.2s, background 0.2s',
                    marginLeft: '-4px'
                }}
                onMouseEnter={(e) => {
                    e.target.style.color = '#f4f4f5';
                    e.target.style.background = '#27272a';
                }}
                onMouseLeave={(e) => {
                    e.target.style.color = '#a1a1aa';
                    e.target.style.background = 'transparent';
                }}
            >
                <X size={14} strokeWidth={2.5} />
            </button>

            <style>{`
                @keyframes toastSlideIn {
                    from {
                        transform: translateY(100%) scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                }
                @keyframes toastSlideOut {
                    from {
                        transform: scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};
