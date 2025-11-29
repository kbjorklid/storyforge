import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Sparkles, Save, ArrowLeft, GitBranch } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { improveStory, generateVersionChangeDescription } from '../services/ai';
import ContentContainer from './ContentContainer';
import VersionGraph from './VersionGraph';

const StoryView = ({ storyId, onBack }) => {
    const { stories, saveStory, restoreVersion, settings, updateVersion, projects } = useStore();
    const story = stories[storyId];
    const project = projects.find(p => p.id === story?.parentId) || projects.find(p => p.rootFolderId === story?.parentId) || projects.find(p => {
        // Fallback to find project by checking if story is in project's folder tree
        // This is a bit complex without a direct link, but let's assume story.parentId is a folder ID.
        // We need to find the project that owns this folder.
        // Actually, let's look at how we can get the project.
        // The store has folders, but they are in a separate slice.
        // Let's just get the project from the URL or props if possible?
        // Wait, StoryView is rendered inside Layout -> Sidebar/Content.
        // But we don't have projectId passed here directly.
        // However, we can find the project by iterating projects and checking if the story belongs to it.
        // Or simpler: The story has a parentId which is a folder. The folder has a projectId.
        return false;
    });

    // Better approach: Use the folders slice to find the project ID from the story's parent folder.
    const { folders } = useStore();
    const parentFolder = folders[story?.parentId];
    const projectContext = parentFolder ? projects.find(p => p.id === parentFolder.projectId) : null;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        acceptanceCriteria: ''
    });
    const [isImproving, setIsImproving] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('edit');
    const [selectedVersionId, setSelectedVersionId] = useState(null);

    useEffect(() => {
        if (story) {
            setFormData({
                title: story.title,
                description: story.description,
                acceptanceCriteria: story.acceptanceCriteria
            });
            if (!selectedVersionId && story.currentVersionId) {
                setSelectedVersionId(story.currentVersionId);
            }
        }
    }, [story]);

    if (!story) return <div>Story not found</div>;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const oldVersionId = story.currentVersionId;
        const oldVersion = story.versions && oldVersionId ? story.versions[oldVersionId] : null;

        const newVersionId = saveStory(storyId, formData);

        if (oldVersion && newVersionId) {
            const newVersionForAI = {
                title: formData.title,
                description: formData.description,
                acceptanceCriteria: formData.acceptanceCriteria
            };

            generateVersionChangeDescription(oldVersion, newVersionForAI, settings).then(result => {
                if (result) {
                    updateVersion(storyId, newVersionId, {
                        changeTitle: result.changeTitle,
                        changeDescription: result.changeDescription
                    });
                }
            });
        }
    };

    const handleImprove = async () => {
        if (!settings.openRouterKey) {
            setError('Please add your OpenRouter API Key in Settings first.');
            return;
        }

        setIsImproving(true);
        setError(null);
        try {
            const improved = await improveStory(formData, settings, {
                context: projectContext?.context,
                systemPrompt: projectContext?.systemPrompt
            });
            setAiSuggestion(improved);
        } catch (err) {
            setError('Failed to improve story: ' + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    const applySuggestion = () => {
        const oldVersionId = story.currentVersionId;
        const oldVersion = story.versions && oldVersionId ? story.versions[oldVersionId] : null;

        setFormData(aiSuggestion);
        setAiSuggestion(null);
        const newVersionId = saveStory(storyId, aiSuggestion, 'ai');
        setActiveTab('edit');

        if (oldVersion && newVersionId) {
            generateVersionChangeDescription(oldVersion, aiSuggestion, settings).then(result => {
                if (result) {
                    updateVersion(storyId, newVersionId, {
                        changeTitle: result.changeTitle,
                        changeDescription: result.changeDescription
                    });
                }
            });
        }
    };

    const rejectSuggestion = () => {
        setAiSuggestion(null);
        setActiveTab('edit');
    };

    const handleVersionSelect = (versionId) => {
        setSelectedVersionId(versionId);
    };

    const handleRestore = () => {
        if (selectedVersionId) {
            restoreVersion(storyId, selectedVersionId);
            setActiveTab('edit');
        }
    };

    const selectedVersion = story.versions && selectedVersionId ? story.versions[selectedVersionId] : null;

    return (
        <ContentContainer maxWidth="1000px">
            <button
                onClick={onBack}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.25rem 0.5rem' }}
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem' }}>{story.title}</h2>
                {activeTab === 'edit' && (
                    <button
                        onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Save size={16} /> Save
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('edit')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderBottom: activeTab === 'edit' ? '2px solid var(--color-accent)' : 'none',
                        color: activeTab === 'edit' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'edit' ? '600' : '400',
                        background: 'none',
                        borderRadius: 0
                    }}
                >
                    Edit Story
                </button>
                <button
                    onClick={() => setActiveTab('rewrite')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderBottom: activeTab === 'rewrite' ? '2px solid var(--color-accent)' : 'none',
                        color: activeTab === 'rewrite' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'rewrite' ? '600' : '400',
                        background: 'none',
                        borderRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Sparkles size={16} /> Rewrite Story
                </button>
                <button
                    onClick={() => setActiveTab('versions')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderBottom: activeTab === 'versions' ? '2px solid var(--color-accent)' : 'none',
                        color: activeTab === 'versions' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'versions' ? '600' : '400',
                        background: 'none',
                        borderRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <GitBranch size={16} /> Versions
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '4px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {activeTab === 'edit' ? (
                <div className="editor-column">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            style={{ width: '100%', fontSize: '1.1rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={8}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Acceptance Criteria</label>
                        <textarea
                            name="acceptanceCriteria"
                            value={formData.acceptanceCriteria}
                            onChange={handleChange}
                            rows={8}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>
                </div>
            ) : activeTab === 'rewrite' ? (
                <div className="rewrite-column" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    {!aiSuggestion && !isImproving ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.8 }}>
                            <Sparkles size={48} color="var(--color-accent)" />
                            <p style={{ fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px' }}>
                                Use AI to rewrite and improve your story. This will generate a new title, description, and acceptance criteria based on the current content.
                            </p>
                            <button
                                onClick={handleImprove}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-accent)', fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}
                            >
                                <Sparkles size={20} />
                                Improve with AI
                            </button>
                        </div>
                    ) : isImproving ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--color-bg-secondary)', borderTop: '4px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            <p style={{ fontSize: '1.1rem' }}>Rewriting story with AI...</p>
                        </div>
                    ) : (
                        <div className="suggestion-column" style={{ border: '1px solid var(--color-accent)', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={20} /> AI Suggestion
                            </h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Title:</strong>
                                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', fontSize: '1.1rem' }}>
                                    {aiSuggestion.title}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Description:</strong>
                                <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                                    <ReactMarkdown>{aiSuggestion.description}</ReactMarkdown>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Acceptance Criteria:</strong>
                                <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
                                    <ReactMarkdown>{aiSuggestion.acceptanceCriteria}</ReactMarkdown>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                <button onClick={rejectSuggestion} style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem 1.5rem' }}>Reject</button>
                                <button onClick={applySuggestion} style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.75rem 1.5rem' }}>Accept Changes</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="versions-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
                    <div style={{ height: '400px', flexShrink: 0 }}>
                        <VersionGraph
                            versions={story.versions}
                            currentVersionId={story.currentVersionId}
                            selectedVersionId={selectedVersionId}
                            onSelect={handleVersionSelect}
                        />
                    </div>

                    {selectedVersion && (
                        <div style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>Version Preview</h3>
                                {selectedVersionId !== story.currentVersionId && (
                                    <button
                                        onClick={handleRestore}
                                        style={{
                                            backgroundColor: 'var(--color-accent)',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <GitBranch size={16} /> Restore this Version
                                    </button>
                                )}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Title:</strong> {selectedVersion.title}
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Description:</strong>
                                <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '4px', marginTop: '0.5rem' }}>
                                    <ReactMarkdown>{selectedVersion.description}</ReactMarkdown>
                                </div>
                            </div>
                            <div>
                                <strong>Acceptance Criteria:</strong>
                                <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '4px', marginTop: '0.5rem' }}>
                                    <ReactMarkdown>{selectedVersion.acceptanceCriteria}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </ContentContainer>
    );
};

export default StoryView;
