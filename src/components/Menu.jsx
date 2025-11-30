import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Menu = ({ isOpen, onClose, position, items }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                zIndex: 1000,
                minWidth: '150px',
                padding: '0.25rem 0'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                        onClose();
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'transparent',
                        color: item.danger ? 'var(--color-warning)' : 'var(--color-text-primary)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                        gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {item.icon && <span style={{ opacity: 0.7 }}>{item.icon}</span>}
                    {item.label}
                </button>
            ))}
        </div>,
        document.body
    );
};

export default Menu;
