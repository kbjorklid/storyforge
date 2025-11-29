import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Settings, LayoutDashboard } from 'lucide-react';

const ProjectView = ({ projectId }) => {
    const { projects, updateProject } = useStore();
    const project = projects.find(p => p.id === projectId);
    const [activeTab, setActiveTab] = useState('overview');
    const [formData, setFormData] = useState({
        context: '',
        systemPrompt: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                context: project.context || '',
                systemPrompt: project.systemPrompt || ''
            });
        }
    }, [project]);

    if (!project) return <div>Project not found</div>;

    const handleSaveSettings = () => {
        updateProject(projectId, formData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Auto-save on blur or when switching tabs could be nice, 
    // but for now let's just save on change or maybe add a save button?
    // Actually, let's auto-save on blur for better UX or just use a save button if preferred.
    // Given the requirement "Save settings to project data", let's do it on blur to be seamless.
    const handleBlur = () => {
        handleSaveSettings();
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <h2 style={{ margin: 0, color: 'var(--color-text-primary)' }}>{project.name}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 'overview' ? 'var(--color-bg-tertiary)' : 'transparent',
                            borderRadius: '4px',
                            color: activeTab === 'overview' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                        }}
                    >
                        <LayoutDashboard size={16} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 'settings' ? 'var(--color-bg-tertiary)' : 'transparent',
                            borderRadius: '4px',
                            color: activeTab === 'settings' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                        }}
                    >
                        <Settings size={16} /> Project Settings
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {activeTab === 'overview' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                        <p>Select a story from the sidebar to edit, or create a new one.</p>
                    </div>
                ) : (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Project Context</h3>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Provide a description of your project. This context will be used by the AI to understand the background, domain, and specific requirements of your application when writing or rewriting stories.
                            </p>
                            <textarea
                                name="context"
                                value={formData.context}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="e.g. This is a healthcare application for managing patient records..."
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Story System Prompt</h3>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                Define custom instructions for the AI when it writes stories. You can specify the tone, format, or specific rules it should follow (e.g., "Always include Gherkin syntax in acceptance criteria").
                            </p>
                            <textarea
                                name="systemPrompt"
                                value={formData.systemPrompt}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="e.g. You are an expert Agile coach. Always write acceptance criteria in Gherkin format..."
                                rows={6}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-primary)',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectView;
