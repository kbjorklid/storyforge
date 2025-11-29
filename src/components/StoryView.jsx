import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Sparkles, Save, GitBranch, Scissors } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { improveStory, generateVersionChangeDescription, generateClarifyingQuestions, splitStory } from '../services/ai';
import ContentContainer from './ContentContainer';
import VersionGraph from './VersionGraph';

const StoryView = ({ storyId }) => {
    const { stories, saveStory, restoreVersion, settings, updateVersion, projects, addStory, deleteStory, unsavedStories, setStoryUnsaved } = useStore();
    const story = stories[storyId];
    // const project = projects.find(p => p.id === story?.parentId) || projects.find(p => p.rootFolderId === story?.parentId);

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
    const [askClarifyingQuestions, setAskClarifyingQuestions] = useState(false);
    const [clarifyingQuestions, setClarifyingQuestions] = useState(null);
    const [answers, setAnswers] = useState({});

    // Split Story State
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitStories, setSplitStories] = useState(null);
    const [retainOriginal, setRetainOriginal] = useState(true);
    const [splitInstructions, setSplitInstructions] = useState('');
    const [activeSplitTab, setActiveSplitTab] = useState(0); // 0 for original, 1+ for new stories

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
            // Reset unsaved state when story changes or loads
            setStoryUnsaved(storyId, false);
        }
    }, [storyId, story?.currentVersionId]); // Only reset when ID or version changes, not when story object updates (which happens on save)

    // Check for unsaved changes
    useEffect(() => {
        if (!story) return;

        const hasChanges =
            formData.title !== story.title ||
            formData.description !== story.description ||
            formData.acceptanceCriteria !== story.acceptanceCriteria;

        setStoryUnsaved(storyId, hasChanges);
    }, [formData, story, storyId, setStoryUnsaved]);

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
        setClarifyingQuestions(null);
        setAnswers({});

        try {
            if (askClarifyingQuestions) {
                const questions = await generateClarifyingQuestions(formData, settings, {
                    context: projectContext?.context,
                    systemPrompt: projectContext?.systemPrompt
                });

                if (questions && questions.length > 0) {
                    setClarifyingQuestions(questions);
                } else {
                    // If no questions generated, proceed directly to improvement
                    const improved = await improveStory(formData, settings, {
                        context: projectContext?.context,
                        systemPrompt: projectContext?.systemPrompt
                    });
                    setAiSuggestion(improved);
                }
            } else {
                const improved = await improveStory(formData, settings, {
                    context: projectContext?.context,
                    systemPrompt: projectContext?.systemPrompt
                });
                setAiSuggestion(improved);
            }
        } catch (err) {
            setError('Failed to improve story: ' + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    const handleSubmitAnswers = async () => {
        setIsImproving(true);
        setError(null);
        try {
            // Format answers for the AI
            const qaContext = clarifyingQuestions.map(q => {
                let answer = answers[q.id];
                if (Array.isArray(answer)) {
                    answer = answer.join(', ');
                }
                return {
                    question: q.text,
                    answer: answer || 'Skipped'
                };
            });

            const improved = await improveStory(formData, settings, {
                context: projectContext?.context,
                systemPrompt: projectContext?.systemPrompt
            }, qaContext);
            setAiSuggestion(improved);
            setClarifyingQuestions(null); // Clear questions after success
        } catch (err) {
            setError('Failed to improve story: ' + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    const handleAnswerChange = (questionId, value, type) => {
        setAnswers(prev => {
            if (type === 'multi_select') {
                const current = prev[questionId] || [];
                if (current.includes(value)) {
                    return { ...prev, [questionId]: current.filter(v => v !== value) };
                } else {
                    return { ...prev, [questionId]: [...current, value] };
                }
            }
            return { ...prev, [questionId]: value };
        });
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

    const handleSplit = async () => {
        if (!settings.openRouterKey) {
            setError('Please add your OpenRouter API Key in Settings first.');
            return;
        }

        setIsSplitting(true);
        setError(null);
        setSplitStories(null);

        try {
            const result = await splitStory(formData, settings, {
                context: projectContext?.context,
                systemPrompt: projectContext?.systemPrompt
            });

            if (result && result.length > 0) {
                setSplitStories(result);
                setActiveSplitTab(1); // Switch to first split story
            } else {
                throw new Error("AI returned no stories. Please try again.");
            }
        } catch (err) {
            setError('Failed to split story: ' + err.message);
        } finally {
            setIsSplitting(false);
        }
    };

    const handleReSplit = async () => {
        if (!settings.openRouterKey) {
            setError('Please add your OpenRouter API Key in Settings first.');
            return;
        }

        setIsSplitting(true);
        setError(null);

        try {
            const result = await splitStory(formData, settings, {
                context: projectContext?.context,
                systemPrompt: projectContext?.systemPrompt
            }, splitInstructions);

            if (result && result.length > 0) {
                setSplitStories(result);
                setActiveSplitTab(1);
            } else {
                throw new Error("AI returned no stories. Please try again.");
            }
        } catch (err) {
            setError('Failed to split story: ' + err.message);
        } finally {
            setIsSplitting(false);
        }
    };

    const handleAcceptSplit = () => {
        if (!splitStories) return;

        // Create new stories
        splitStories.forEach(newStory => {
            addStory(story.parentId, newStory.title, newStory.description, newStory.acceptanceCriteria);
        });

        // Handle original story
        if (!retainOriginal) {
            deleteStory(storyId);
            // Redirect or clear selection? 
            // Since we are inside the story view, if we delete it, we should probably show a message or redirect.
            // But for now, let's just delete it. The parent component might handle the disappearance.
        }

        // Reset state
        setSplitStories(null);
        setSplitInstructions('');
        setActiveTab('edit');
        // If we deleted the story, we probably shouldn't be here anymore.
        // But if we retained it, we just go back to edit.
    };

    const selectedVersion = story.versions && selectedVersionId ? story.versions[selectedVersionId] : null;

    return (
        <ContentContainer maxWidth="1000px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {story.title}
                    {unsavedStories[storyId] && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-warning)' }}>
                            Unsaved Changes
                        </span>
                    )}
                </h2>
                {activeTab === 'edit' && (
                    <button
                        onClick={handleSave}
                        disabled={!unsavedStories[storyId]}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: unsavedStories[storyId] ? 1 : 0.5,
                            cursor: unsavedStories[storyId] ? 'pointer' : 'default'
                        }}
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
                <button
                    onClick={() => setActiveTab('split')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderBottom: activeTab === 'split' ? '2px solid var(--color-accent)' : 'none',
                        color: activeTab === 'split' ? 'var(--color-text)' : 'var(--color-text-muted)',
                        fontWeight: activeTab === 'split' ? '600' : '400',
                        background: 'none',
                        borderRadius: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Scissors size={16} /> Split Story
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
                    {!aiSuggestion && !isImproving && !clarifyingQuestions ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.8 }}>
                            <Sparkles size={48} color="var(--color-accent)" />
                            <p style={{ fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px' }}>
                                Use AI to rewrite and improve your story. This will generate a new title, description, and acceptance criteria based on the current content.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input
                                    type="checkbox"
                                    id="askClarifyingQuestions"
                                    checked={askClarifyingQuestions}
                                    onChange={(e) => setAskClarifyingQuestions(e.target.checked)}
                                    style={{ width: '1.2rem', height: '1.2rem' }}
                                />
                                <label htmlFor="askClarifyingQuestions" style={{ fontSize: '1.1rem', cursor: 'pointer' }}>
                                    Ask clarifying questions
                                </label>
                            </div>
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
                            <p style={{ fontSize: '1.1rem' }}>{clarifyingQuestions ? 'Generating rewrite...' : 'Processing...'}</p>
                        </div>
                    ) : clarifyingQuestions ? (
                        <div className="questions-column" style={{ border: '1px solid var(--color-accent)', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)' }}>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={20} /> Clarifying Questions
                            </h3>
                            <p style={{ marginBottom: '1.5rem' }}>Please answer the following questions to help the AI improve your story.</p>

                            {clarifyingQuestions.map((q, index) => (
                                <div key={q.id || index} style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>{index + 1}. {q.text}</label>

                                    {q.type === 'text' && (
                                        <textarea
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')}
                                            rows={3}
                                            style={{ width: '100%', resize: 'vertical' }}
                                        />
                                    )}

                                    {q.type === 'single_select' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {q.options?.map((option, i) => (
                                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${q.id}`}
                                                        value={option}
                                                        checked={answers[q.id] === option}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value, 'single_select')}
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'multi_select' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {q.options?.map((option, i) => (
                                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        value={option}
                                                        checked={(answers[q.id] || []).includes(option)}
                                                        onChange={() => handleAnswerChange(q.id, option, 'multi_select')}
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => setClarifyingQuestions(null)} style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', padding: '0.75rem 1.5rem' }}>Cancel</button>
                                <button onClick={handleSubmitAnswers} style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '0.75rem 1.5rem' }}>Submit Answers & Rewrite</button>
                            </div>
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
            ) : activeTab === 'split' ? (
                <div className="split-column" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                    {!splitStories && !isSplitting ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.8 }}>
                            <Scissors size={48} color="var(--color-accent)" />
                            <p style={{ fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px' }}>
                                Use AI to split this story into multiple smaller, independent stories.
                            </p>
                            <button
                                onClick={handleSplit}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-accent)', fontSize: '1.1rem', padding: '0.75rem 1.5rem' }}
                            >
                                <Scissors size={20} />
                                Split Story
                            </button>
                        </div>
                    ) : isSplitting ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                            <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--color-bg-secondary)', borderTop: '4px solid var(--color-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                            <p style={{ fontSize: '1.1rem' }}>Splitting story...</p>
                        </div>
                    ) : (
                        <div className="split-results" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                <button
                                    onClick={() => setActiveSplitTab(0)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: activeSplitTab === 0 ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                        color: activeSplitTab === 0 ? 'white' : 'var(--color-text)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Original Story
                                </button>
                                {splitStories.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveSplitTab(i + 1)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: activeSplitTab === i + 1 ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                            color: activeSplitTab === i + 1 ? 'white' : 'var(--color-text)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        Split Story {i + 1}
                                    </button>
                                ))}
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)', marginBottom: '1.5rem' }}>
                                {activeSplitTab === 0 ? (
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>{story.title}</h3>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong>Description:</strong>
                                            <div style={{ marginTop: '0.5rem' }}><ReactMarkdown>{story.description}</ReactMarkdown></div>
                                        </div>
                                        <div>
                                            <strong>Acceptance Criteria:</strong>
                                            <div style={{ marginTop: '0.5rem' }}><ReactMarkdown>{story.acceptanceCriteria}</ReactMarkdown></div>
                                        </div>
                                    </div>
                                ) : splitStories[activeSplitTab - 1] ? (
                                    <div>
                                        <h3 style={{ marginBottom: '1rem' }}>{splitStories[activeSplitTab - 1].title}</h3>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <strong>Description:</strong>
                                            <div style={{ marginTop: '0.5rem' }}><ReactMarkdown>{splitStories[activeSplitTab - 1].description}</ReactMarkdown></div>
                                        </div>
                                        <div>
                                            <strong>Acceptance Criteria:</strong>
                                            <div style={{ marginTop: '0.5rem' }}><ReactMarkdown>{splitStories[activeSplitTab - 1].acceptanceCriteria}</ReactMarkdown></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>Story data not found.</div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={retainOriginal}
                                            onChange={(e) => setRetainOriginal(e.target.checked)}
                                            style={{ width: '1.2rem', height: '1.2rem' }}
                                        />
                                        <span style={{ fontSize: '1.1rem' }}>Retain original story</span>
                                    </label>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Instructions for Re-splitting (optional)</label>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <textarea
                                            value={splitInstructions}
                                            onChange={(e) => setSplitInstructions(e.target.value)}
                                            placeholder="E.g., Split into 3 stories instead of 2..."
                                            rows={2}
                                            style={{ flex: 1, resize: 'vertical' }}
                                        />
                                        <button
                                            onClick={handleReSplit}
                                            disabled={!splitInstructions.trim()}
                                            style={{
                                                backgroundColor: splitInstructions.trim() ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                                                color: splitInstructions.trim() ? 'white' : 'var(--color-text-muted)',
                                                cursor: splitInstructions.trim() ? 'pointer' : 'not-allowed',
                                                padding: '0 1.5rem',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            Re-split
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button
                                        onClick={() => setSplitStories(null)}
                                        style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', padding: '0.75rem 1.5rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAcceptSplit}
                                        style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.75rem 1.5rem' }}
                                    >
                                        Accept & Create Stories
                                    </button>
                                </div>
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
