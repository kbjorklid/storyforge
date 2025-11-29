import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Settings, LayoutDashboard, Trash2, RotateCcw } from 'lucide-react';

const ProjectView = ({ projectId }) => {
    const { projects, updateProject, stories, folders, restoreStory, permanentlyDeleteStory } = useStore();
    const project = projects.find(p => p.id === projectId);
    const [activeTab, setActiveTab] = useState('overview');
    const [formData, setFormData] = useState({
        context: '',
        systemPrompt: ''
    });

    useEffect(() => {
        if (project) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData(prev => {
                if (prev.context !== (project.context || '') || prev.systemPrompt !== (project.systemPrompt || '')) {
                    return {
                        context: project.context || '',
                        systemPrompt: project.systemPrompt || ''
                    };
                }
                return prev;
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

    const handleBlur = () => {
        handleSaveSettings();
    };

    // Helper to check if a story belongs to the current project
    const isStoryInProject = (story) => {
        if (!story || !story.parentId) return false;
        const parentFolder = folders[story.parentId];
        return parentFolder && parentFolder.projectId === projectId;
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
                    <button
                        onClick={() => setActiveTab('deleted')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTab === 'deleted' ? 'var(--color-bg-tertiary)' : 'transparent',
                            borderRadius: '4px',
                            color: activeTab === 'deleted' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                        }}
                    >
                        <Trash2 size={16} /> Deleted Stories
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {activeTab === 'overview' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
                        <p>Select a story from the sidebar to edit, or create a new one.</p>
                    </div>
                ) : activeTab === 'settings' ? (
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
                ) : activeTab === 'deleted' ? (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-text-primary)' }}>Deleted Stories</h3>
                        {Object.values(stories).filter(s => s.deleted && isStoryInProject(s)).length === 0 ? (
                            <p style={{ color: 'var(--color-text-secondary)' }}>No deleted stories found.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.values(stories)
                                    .filter(s => s.deleted && isStoryInProject(s))
                                    .map(story => (
                                        <div key={story.id} style={{
                                            padding: '1rem',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            borderRadius: '4px',
                                            border: '1px solid var(--color-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-primary)' }}>{story.title}</h4>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                    Deleted on {new Date().toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => restoreStory(story.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.5rem 1rem',
                                                        backgroundColor: 'var(--color-bg-primary)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '4px',
                                                        color: 'var(--color-text-primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <RotateCcw size={14} /> Restore
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to permanently delete this story? This action cannot be undone.')) {
                                                            permanentlyDeleteStory(story.id);
                                                        }
                                                    }}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        padding: '0.5rem 1rem',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid var(--color-danger)',
                                                        borderRadius: '4px',
                                                        color: 'var(--color-danger)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={14} /> Delete Forever
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ProjectView;
