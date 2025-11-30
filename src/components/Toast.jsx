import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const Toast = ({ id, message, type = 'info', action, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} color="var(--color-success)" />,
        warning: <AlertTriangle size={20} color="var(--color-warning)" />,
        error: <AlertCircle size={20} color="var(--color-danger)" />,
        info: <Info size={20} color="var(--color-accent)" />,
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                minWidth: '300px',
                maxWidth: '400px',
                pointerEvents: 'auto', // Re-enable pointer events for the toast itself
                color: 'var(--color-text-primary)',
            }}
        >
            <div style={{ flexShrink: 0 }}>{icons[type]}</div>
            <div style={{ flex: 1, fontSize: '0.95rem' }}>{message}</div>
            {action && (
                <button
                    onClick={() => {
                        action.onClick();
                        onClose();
                    }}
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--color-accent)',
                        color: 'var(--color-accent)',
                        padding: '4px 10px',
                        fontSize: '0.85rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginRight: '8px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {action.label}
                </button>
            )}
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export default Toast;
