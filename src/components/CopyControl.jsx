import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

const CopyControl = ({ text, style = {} }) => {
    const [status, setStatus] = useState('idle'); // idle, success, error

    const handleCopy = async () => {
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <button
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: status === 'success' ? 'var(--color-success)' : status === 'error' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                transition: 'color 0.2s ease',
                ...style
            }}
            aria-label="Copy to clipboard"
        >
            {status === 'success' ? (
                <Check size={16} />
            ) : status === 'error' ? (
                <X size={16} />
            ) : (
                <Copy size={16} />
            )}
        </button>
    );
};

export default CopyControl;
