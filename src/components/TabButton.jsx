import React from 'react';
import { motion } from 'framer-motion';

const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        style={{
            padding: '0.75rem 1.5rem',
            color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            fontWeight: active ? '600' : '500',
            background: 'none',
            border: 'none',
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            position: 'relative',
            cursor: 'pointer',
            transition: 'color 0.3s ease'
        }}
    >
        <Icon size={16} /> {label}
        {active && (
            <motion.div
                layoutId="activeTab"
                style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: 'var(--color-accent)',
                    boxShadow: '0 0 8px var(--color-accent-glow)'
                }}
            />
        )}
    </button>
);

export default TabButton;
