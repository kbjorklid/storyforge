import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Trash2 } from 'lucide-react';
import { getAIHistory, clearAIHistory } from '../services/ai';

import { createPortal } from 'react-dom';

const AIDebugModal = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const scrollRef = useRef(null);

    const loadHistory = () => {
        setHistory([...getAIHistory()]);
    };

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleClear = () => {
        clearAIHistory();
        loadHistory();
    };

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                width: '80%',
                maxWidth: '800px',
                height: '80%',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--glass-shadow)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--color-bg-tertiary)'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>AI Debug History</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={loadHistory} title="Refresh" style={{ padding: '0.4rem' }}>
                            <RefreshCw size={18} />
                        </button>
                        <button onClick={handleClear} title="Clear History" style={{ padding: '0.4rem' }}>
                            <Trash2 size={18} />
                        </button>
                        <button onClick={onClose} title="Close" style={{ padding: '0.4rem' }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '2rem' }}>
                            No history available.
                        </div>
                    ) : (
                        history.map((entry) => (
                            <div key={entry.id} style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                backgroundColor: 'var(--color-bg-primary)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    <span style={{
                                        textTransform: 'uppercase',
                                        fontWeight: 'bold',
                                        color: entry.type === 'input' ? 'var(--color-accent)' : 'var(--color-success)'
                                    }}>
                                        {entry.type}
                                    </span>
                                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <pre style={{
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: '0.9rem',
                                    fontFamily: 'monospace',
                                    maxHeight: '300px',
                                    overflowY: 'auto'
                                }}>
                                    {entry.content}
                                </pre>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AIDebugModal;
