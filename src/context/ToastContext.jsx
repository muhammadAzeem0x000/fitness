import React, { createContext, useContext, useState, useCallback } from 'react';
import { X } from 'lucide-react';
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
        console.log("Toast Triggered:", message, type);
        const id = Date.now().toString() + Math.random().toString();
        setToasts((prev) => [...prev, { id, message, type, duration, action }]);

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
                bottom: '20px',
                right: '20px',
                zIndex: 2147483647,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '420px',
                width: '100%',
                padding: '0 16px'
            }}
        >
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
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
            icon: '✅',
            bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '#10b981',
        },
        error: {
            icon: '❌',
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            border: '#ef4444',
        },
        info: {
            icon: 'ℹ️',
            bg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: '#3b82f6',
        },
    };

    const style = typeStyles[type] || typeStyles.info;

    return (
        <div
            style={{
                background: style.bg,
                color: 'white',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
                minHeight: '60px',
                animation: isExiting ? 'slideOut 0.2s ease-out' : 'slideIn 0.3s ease-out',
                transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
                opacity: isExiting ? 0 : 1,
                transition: 'transform 0.2s, opacity 0.2s'
            }}
        >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{style.icon}</span>
            <span style={{ flex: 1, lineHeight: '1.4' }}>{message}</span>

            {action && (
                <button
                    onClick={() => {
                        action.onClick();
                        handleClose();
                    }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                >
                    {action.label}
                </button>
            )}

            <button
                onClick={handleClose}
                style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
            >
                <X size={14} />
            </button>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};
