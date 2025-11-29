import React from 'react';
import { useStore } from '../store';
import ContentContainer from './ContentContainer';

const SettingsView = () => {
    const { settings, updateSettings } = useStore();

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateSettings({ [name]: value });
    };

    return (
        <ContentContainer maxWidth="600px">
            <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Settings</h2>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>AI Configuration</h3>
                <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    StoryForge uses OpenRouter to access AI models. You need to provide your own API key.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        OpenRouter API Key
                    </label>
                    <input
                        type="password"
                        name="openRouterKey"
                        value={settings.openRouterKey}
                        onChange={handleChange}
                        placeholder="sk-or-..."
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Large Model (Reasoning)
                    </label>
                    <input
                        type="text"
                        name="largeModel"
                        value={settings.largeModel}
                        onChange={handleChange}
                        placeholder="anthropic/claude-3.5-sonnet"
                        style={{ width: '100%' }}
                    />
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Used for complex tasks like story improvement.
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Small Model (Fast)
                    </label>
                    <input
                        type="text"
                        name="smallModel"
                        value={settings.smallModel}
                        onChange={handleChange}
                        placeholder="google/gemini-flash-1.5"
                        style={{ width: '100%' }}
                    />
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Used for simpler tasks.
                    </p>
                </div>
            </div>
        </ContentContainer>
    );
};

export default SettingsView;
