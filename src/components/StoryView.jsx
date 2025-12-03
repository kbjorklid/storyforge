import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Sparkles, GitBranch, Scissors, Edit, MessageSquare } from 'lucide-react';
import { improveStory, generateClarifyingQuestions, splitStory, generateSubfolderName } from '../services/ai';
import ContentContainer from './ContentContainer';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingAnimation from './LoadingAnimation';
import TabButton from './TabButton';
import EditTab from './StoryViewTabs/EditTab';
import RewriteTab from './StoryViewTabs/RewriteTab';
import SplitTab from './StoryViewTabs/SplitTab';
import VersionsTab from './StoryViewTabs/VersionsTab';
import ChatTab from './ChatTab';

const StoryView = ({ storyId, setHasUnsavedChanges }) => {
    const { stories, saveStory, restoreVersion, settings, updateVersion, projects, addStory, deleteStory, unsavedStories, setStoryUnsaved, drafts, saveDraft, discardDraft, triggerVersionTitleGeneration, addFolder } = useStore();
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
    const [askClarifyingQuestions, setAskClarifyingQuestions] = useState(true);
    const [clarifyingQuestions, setClarifyingQuestions] = useState(null);

    const [answers, setAnswers] = useState({});
    const [ignoredQuestions, setIgnoredQuestions] = useState(new Set());

    const [rewriteSelection, setRewriteSelection] = useState({
        title: true,
        description: true,
        acceptanceCriteria: true
    });

    // Split Story State
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitStories, setSplitStories] = useState(null);
    const [retainOriginal, setRetainOriginal] = useState(true);
    const [splitInstructions, setSplitInstructions] = useState('');
    const [activeSplitTab, setActiveSplitTab] = useState(0); // 0 for original, 1+ for new stories
    const [askSplitClarifyingQuestions, setAskSplitClarifyingQuestions] = useState(true);
    const [splitClarifyingQuestions, setSplitClarifyingQuestions] = useState(null);
    const [splitAnswers, setSplitAnswers] = useState({});
    const [createSubfolder, setCreateSubfolder] = useState(false);
    const [subfolderName, setSubfolderName] = useState('');

    useEffect(() => {
        if (story) {
            // Check for draft first
            if (drafts[storyId]) {
                const draft = drafts[storyId];
                setFormData(draft.content);
                setStoryUnsaved(storyId, true);
            } else {
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
        }
    }, [storyId, story?.currentVersionId]); // Only reset when ID or version changes, not when story object updates (which happens on save)

    // Save draft on change
    useEffect(() => {
        if (!story) return;

        const hasChanges =
            formData.title !== story.title ||
            formData.description !== story.description ||
            formData.acceptanceCriteria !== story.acceptanceCriteria;

        if (hasChanges) {
            const timeoutId = setTimeout(() => {
                saveDraft(storyId, formData, story.currentVersionId);
            }, 500); // Debounce draft saving
            return () => clearTimeout(timeoutId);
        }
    }, [formData, story, storyId, saveDraft]);

    // Check for unsaved changes
    useEffect(() => {
        if (!story) return;

        const hasChanges =
            formData.title !== story.title ||
            formData.description !== story.description ||
            formData.acceptanceCriteria !== story.acceptanceCriteria;

        setStoryUnsaved(storyId, hasChanges);
    }, [formData, story, storyId, setStoryUnsaved]);

    // Check for unsaved AI changes (Rewrite or Split)
    useEffect(() => {
        if (!setHasUnsavedChanges) return;

        const hasUnsavedAIChanges =
            (activeTab === 'rewrite' && (aiSuggestion || clarifyingQuestions)) ||
            (activeTab === 'split' && (splitStories || splitClarifyingQuestions));

        setHasUnsavedChanges(hasUnsavedAIChanges);

        return () => setHasUnsavedChanges(false);
    }, [activeTab, aiSuggestion, clarifyingQuestions, splitStories, splitClarifyingQuestions, setHasUnsavedChanges]);

    // Reset state when story changes
    useEffect(() => {
        setActiveTab('edit');
        setAiSuggestion(null);
        setClarifyingQuestions(null);
        setSplitStories(null);
        setSplitClarifyingQuestions(null);
        setAnswers({});
        setSplitAnswers({});
        setIsImproving(false);
        setIsSplitting(false);
        setError(null);
        setIgnoredQuestions(new Set());
    }, [storyId]);

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

            triggerVersionTitleGeneration(storyId, newVersionId, oldVersion, newVersionForAI);
        }
    };

    const handleDiscard = () => {
        discardDraft(storyId);
        setFormData({
            title: story.title,
            description: story.description,
            acceptanceCriteria: story.acceptanceCriteria
        });
        setStoryUnsaved(storyId, false);
    };

    const handleImprove = async () => {
        if (!settings.openRouterKey) {
            setError('Please add your OpenRouter API Key in Settings first.');
            return;
        }

        if (unsavedStories[storyId]) {
            handleSave();
        }

        const hasSelection = Object.values(rewriteSelection).some(v => v);
        if (!hasSelection) {
            setError('Please select at least one part of the story to rewrite.');
            return;
        }

        setIsImproving(true);
        setError(null);
        setClarifyingQuestions(null);
        setAnswers({});
        setIgnoredQuestions(new Set());


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
                    }, null, rewriteSelection);
                    setAiSuggestion(improved);
                }
            } else {
                const improved = await improveStory(formData, settings, {
                    context: projectContext?.context,
                    systemPrompt: projectContext?.systemPrompt
                }, null, rewriteSelection);
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
            const qaContext = clarifyingQuestions
                .filter(q => !ignoredQuestions.has(q.id))
                .map(q => {

                    let answer = answers[q.id];
                    if (Array.isArray(answer)) {
                        answer = answer.join(', ');
                    }
                    return {
                        question: q.text,
                        answer: answer || 'Skipped'
                    };
                });

            if (answers['other_notes']) {
                qaContext.push({
                    question: "Additional User Notes",
                    answer: answers['other_notes']
                });
            }

            const improved = await improveStory(formData, settings, {
                context: projectContext?.context,
                systemPrompt: projectContext?.systemPrompt
            }, qaContext, rewriteSelection);
            setAiSuggestion(improved);
            setClarifyingQuestions(null); // Clear questions after success
        } catch (err) {
            setError('Failed to improve story: ' + err.message);
        } finally {
            setIsImproving(false);
        }
    };

    const handleIgnoreQuestion = (questionId) => {
        setIgnoredQuestions(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
            }
            return next;
        });
    };

    const handleAnswerChange = (questionId, value, type, oldValue = null) => {
        setAnswers(prev => {
            if (type === 'multi_select') {
                const current = prev[questionId] || [];
                if (oldValue) {
                    return { ...prev, [questionId]: current.map(v => v === oldValue ? value : v) };
                }
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
            triggerVersionTitleGeneration(storyId, newVersionId, oldVersion, aiSuggestion);
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

    const handleSplitAnswerChange = (questionId, value, type, oldValue = null) => {
        setSplitAnswers(prev => {
            if (type === 'multi_select') {
                const current = prev[questionId] || [];
                if (oldValue) {
                    return { ...prev, [questionId]: current.map(v => v === oldValue ? value : v) };
                }
                if (current.includes(value)) {
                    return { ...prev, [questionId]: current.filter(v => v !== value) };
                } else {
                    return { ...prev, [questionId]: [...current, value] };
                }
            }
            return { ...prev, [questionId]: value };
        });
    };

    const handleSubmitSplitAnswers = async () => {
        setIsSplitting(true);
        setError(null);
        try {
            // Format answers for the AI
            const qaContext = splitClarifyingQuestions
                .filter(q => !ignoredQuestions.has(q.id))
                .map(q => {

                    let answer = splitAnswers[q.id];
                    if (Array.isArray(answer)) {
                        answer = answer.join(', ');
                    }
                    return {
                        question: q.text,
                        answer: answer || 'Skipped'
                    };
                });

            if (splitAnswers['other_notes']) {
                qaContext.push({
                    question: "Additional User Notes",
                    answer: splitAnswers['other_notes']
                });
            }

            const [result, subfolderNameSuggestion] = await Promise.all([
                splitStory(formData, settings, {
                    context: projectContext?.context,
                    systemPrompt: projectContext?.systemPrompt
                }, splitInstructions, qaContext),
                generateSubfolderName(formData, settings)
            ]);

            if (result && result.length > 0) {
                setSplitStories(result);
                setActiveSplitTab(1);
                setSplitClarifyingQuestions(null);
                if (subfolderNameSuggestion) {
                    setSubfolderName(subfolderNameSuggestion);
                    // setCreateSubfolder(true); // Don't auto-check
                }
            } else {
                throw new Error("AI returned no stories. Please try again.");
            }
        } catch (err) {
            setError('Failed to split story: ' + err.message);
        } finally {
            setIsSplitting(false);
        }
    };

    const handleSplit = async () => {
        if (!settings.openRouterKey) {
            setError('Please add your OpenRouter API Key in Settings first.');
            return;
        }

        if (unsavedStories[storyId]) {
            handleSave();
        }

        setIsSplitting(true);
        setError(null);
        setSplitStories(null);
        setSplitClarifyingQuestions(null);
        setSplitAnswers({});
        setIgnoredQuestions(new Set());


        try {
            if (askSplitClarifyingQuestions) {
                const questions = await generateClarifyingQuestions(formData, settings, {
                    context: projectContext?.context,
                    systemPrompt: projectContext?.systemPrompt
                }, 'split');

                if (questions && questions.length > 0) {
                    setSplitClarifyingQuestions(questions);
                } else {
                    // If no questions generated, proceed directly to split
                    const [result, subfolderNameSuggestion] = await Promise.all([
                        splitStory(formData, settings, {
                            context: projectContext?.context,
                            systemPrompt: projectContext?.systemPrompt
                        }, splitInstructions),
                        generateSubfolderName(formData, settings)
                    ]);

                    if (result && result.length > 0) {
                        setSplitStories(result);
                        setActiveSplitTab(1); // Switch to first split story
                        if (subfolderNameSuggestion) {
                            setSubfolderName(subfolderNameSuggestion);
                        }
                    } else {
                        throw new Error("AI returned no stories. Please try again.");
                    }
                }
            } else {
                const [result, subfolderNameSuggestion] = await Promise.all([
                    splitStory(formData, settings, {
                        context: projectContext?.context,
                        systemPrompt: projectContext?.systemPrompt
                    }, splitInstructions),
                    generateSubfolderName(formData, settings)
                ]);

                if (result && result.length > 0) {
                    setSplitStories(result);
                    setActiveSplitTab(1); // Switch to first split story
                    if (subfolderNameSuggestion) {
                        setSubfolderName(subfolderNameSuggestion);
                    }
                } else {
                    throw new Error("AI returned no stories. Please try again.");
                }
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

        let targetParentId = story.parentId;

        if (createSubfolder && subfolderName.trim()) {
            const newFolderId = crypto.randomUUID();
            const projectId = projectContext?.id;

            // Assuming addFolder is available in store and takes these arguments
            addFolder(newFolderId, story.parentId, subfolderName, projectId);
            targetParentId = newFolderId;
        }

        // Create new stories
        splitStories.forEach(newStory => {
            addStory(targetParentId, newStory.title, newStory.description, newStory.acceptanceCriteria);
        });

        // Handle original story
        if (!retainOriginal) {
            deleteStory(storyId);
        }

        // Reset state
        setSplitStories(null);
        setSplitInstructions('');
        setCreateSubfolder(false);
        setSubfolderName('');
        setActiveTab('edit');
    };

    const selectedVersion = story.versions && selectedVersionId ? story.versions[selectedVersionId] : null;

    return (
        <ContentContainer maxWidth="1000px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {story.title}
                    {unsavedStories[storyId] && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', flexShrink: 0 }} title="Unsaved Changes"></div>
                    )}
                </h2>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', position: 'relative' }}>
                <TabButton active={activeTab === 'edit'} onClick={() => setActiveTab('edit')} icon={Edit} label="Edit Story" />
                <TabButton active={activeTab === 'rewrite'} onClick={() => setActiveTab('rewrite')} icon={Sparkles} label="Rewrite Story" />
                <TabButton active={activeTab === 'split'} onClick={() => setActiveTab('split')} icon={Scissors} label="Split Story" />
                <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageSquare} label="Chat with AI" />
                <TabButton active={activeTab === 'versions'} onClick={() => setActiveTab('versions')} icon={GitBranch} label="Versions" />
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '4px', marginBottom: '1rem' }}
                >
                    {error}
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {activeTab === 'edit' && (
                    <EditTab
                        storyId={storyId}
                        formData={formData}
                        handleChange={handleChange}
                        handleSave={handleSave}
                        handleDiscard={handleDiscard}
                        unsavedStories={unsavedStories}
                        drafts={drafts}
                    />
                )}

                {activeTab === 'rewrite' && (
                    <RewriteTab
                        storyId={storyId}
                        unsavedStories={unsavedStories}
                        isImproving={isImproving}
                        aiSuggestion={aiSuggestion}
                        error={error}
                        clarifyingQuestions={clarifyingQuestions}
                        answers={answers}
                        rewriteSelection={rewriteSelection}
                        setRewriteSelection={setRewriteSelection}
                        askClarifyingQuestions={askClarifyingQuestions}
                        setAskClarifyingQuestions={setAskClarifyingQuestions}
                        handleImprove={handleImprove}
                        handleSubmitAnswers={handleSubmitAnswers}
                        handleAnswerChange={handleAnswerChange}
                        applySuggestion={applySuggestion}
                        rejectSuggestion={rejectSuggestion}
                        setClarifyingQuestions={setClarifyingQuestions}
                        ignoredQuestions={ignoredQuestions}
                        handleIgnoreQuestion={handleIgnoreQuestion}
                    />
                )}

                {activeTab === 'split' && (
                    <SplitTab
                        story={story}
                        storyId={storyId}
                        unsavedStories={unsavedStories}
                        isSplitting={isSplitting}
                        splitStories={splitStories}
                        setSplitStories={setSplitStories}
                        splitInstructions={splitInstructions}
                        setSplitInstructions={setSplitInstructions}
                        askSplitClarifyingQuestions={askSplitClarifyingQuestions}
                        setAskSplitClarifyingQuestions={setAskSplitClarifyingQuestions}
                        splitClarifyingQuestions={splitClarifyingQuestions}
                        setSplitClarifyingQuestions={setSplitClarifyingQuestions}
                        splitAnswers={splitAnswers}
                        handleSplitAnswerChange={handleSplitAnswerChange}
                        handleSubmitSplitAnswers={handleSubmitSplitAnswers}
                        handleSplit={handleSplit}
                        handleAcceptSplit={handleAcceptSplit}
                        createSubfolder={createSubfolder}
                        setCreateSubfolder={setCreateSubfolder}
                        subfolderName={subfolderName}
                        setSubfolderName={setSubfolderName}
                        activeSplitTab={activeSplitTab}
                        setActiveSplitTab={setActiveSplitTab}
                        handleReSplit={handleReSplit}
                        ignoredQuestions={ignoredQuestions}
                        handleIgnoreQuestion={handleIgnoreQuestion}
                        retainOriginal={retainOriginal}
                        setRetainOriginal={setRetainOriginal}
                    />
                )}

                {activeTab === 'versions' && (
                    <VersionsTab
                        story={story}
                        storyId={storyId}
                        selectedVersionId={selectedVersionId}
                        handleVersionSelect={handleVersionSelect}
                        drafts={drafts}
                        handleRestore={handleRestore}
                        unsavedStories={unsavedStories}
                        handleSplit={handleSplit}
                    />
                )}

                {activeTab === 'chat' && (
                    <div style={{ height: '600px' }}>
                        <ChatTab
                            projectId={projectContext?.id}
                            initialStoryId={storyId}
                            autoStart={true}
                        />
                    </div>
                )}
            </AnimatePresence>
        </ContentContainer>
    );
};

export default StoryView;
