import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadingTexts } from '../constants/loadingTexts';

const LoadingAnimation = ({ text }) => {
    const [currentText, setCurrentText] = useState(() => {
        // Random start
        return loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentText(prev => {
                let nextText;
                do {
                    nextText = loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
                } while (nextText === prev); // Avoid repeating the same text immediately
                return nextText;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-accent)'
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.5, 1, 0.5],
                            boxShadow: [
                                '0 0 0px var(--color-accent-glow)',
                                '0 0 10px var(--color-accent-glow)',
                                '0 0 0px var(--color-accent-glow)'
                            ]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
            <div style={{ height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                        style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}
                    >
                        {text || currentText}
                    </motion.p>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LoadingAnimation;
