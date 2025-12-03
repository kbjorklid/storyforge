import React from 'react';
import { useStore } from '../store';
import ContentContainer from './ContentContainer';

const SettingsView = () => {
    const { settings, updateSettings } = useStore();

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'largeModel' || name === 'smallModel') {
            // Update model for current provider
            const currentProvider = settings.aiProvider || 'openrouter';
            const currentProviderSettings = settings.providerSettings?.[currentProvider] || {};

            updateSettings({
                providerSettings: {
                    ...settings.providerSettings,
                    [currentProvider]: {
                        ...currentProviderSettings,
                        [name]: value
                    }
                }
            });
        } else {
            updateSettings({ [name]: value });
        }
    };

    // Helper to get current model values safely
    const currentProvider = settings.aiProvider || 'openrouter';
    const currentModels = settings.providerSettings?.[currentProvider] || {};
    const largeModelValue = currentModels.largeModel || '';
    const smallModelValue = currentModels.smallModel || '';

    return (
        <ContentContainer maxWidth="600px">
            <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem' }}>Settings</h2>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>AI Configuration</h3>
                <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    StoryForge uses external AI providers. You need to provide your own API key.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        AI Provider
                    </label>
                    <select
                        name="aiProvider"
                        value={settings.aiProvider || 'openrouter'}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.5rem' }}
                    >
                        <option value="openrouter">OpenRouter</option>
                        <option value="anthropic">Anthropic</option>
                    </select>
                </div>

                {settings.aiProvider === 'anthropic' ? (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Anthropic API Key
                        </label>
                        <input
                            type="password"
                            name="anthropicKey"
                            value={settings.anthropicKey || ''}
                            onChange={handleChange}
                            placeholder="sk-ant-..."
                            style={{ width: '100%' }}
                        />
                    </div>
                ) : (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            OpenRouter API Key
                        </label>
                        <input
                            type="password"
                            name="openRouterKey"
                            value={settings.openRouterKey || ''}
                            onChange={handleChange}
                            placeholder="sk-or-..."
                            style={{ width: '100%' }}
                        />
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Large Model (Reasoning)
                    </label>
                    <input
                        type="text"
                        name="largeModel"
                        value={largeModelValue}
                        onChange={handleChange}
                        placeholder={currentProvider === 'anthropic' ? "claude-3-5-sonnet-20240620" : "anthropic/claude-3.5-sonnet"}
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
                        value={smallModelValue}
                        onChange={handleChange}
                        placeholder={currentProvider === 'anthropic' ? "claude-3-haiku-20240307" : "google/gemini-flash-1.5"}
                        style={{ width: '100%' }}
                    />
                    <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        Used for simpler tasks.
                    </p>
                </div>

                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        id="aiDebug"
                        name="aiDebug"
                        checked={settings.aiDebug || false}
                        onChange={(e) => updateSettings({ aiDebug: e.target.checked })}
                        style={{ marginRight: '0.5rem' }}
                    />
                    <label htmlFor="aiDebug" style={{ fontWeight: '500', cursor: 'pointer' }}>
                        AI Debug Mode
                    </label>
                </div>
                <p style={{ marginTop: '-1rem', marginBottom: '1.5rem', marginLeft: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    When enabled, raw AI responses will be logged to the browser console.
                </p>
            </div>
        </ContentContainer>
    );
};

export default SettingsView;
