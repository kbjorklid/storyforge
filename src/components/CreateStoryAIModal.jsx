import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store';
import { generateClarifyingQuestions, generateStoryFromPrompt } from '../services/ai';
import LoadingAnimation from './LoadingAnimation';

const CreateStoryAIModal = ({ isOpen, onClose, targetFolderId, onSuccess }) => {
    const { settings, projects, folders } = useStore();
    const [prompt, setPrompt] = useState('');
    const [askClarifyingQuestions, setAskClarifyingQuestions] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [clarifyingQuestions, setClarifyingQuestions] = useState(null);
    const [answers, setAnswers] = useState({});
    const [ignoredQuestions, setIgnoredQuestions] = useState(new Set());
    const [error, setError] = useState(null);

    // Determine project context
    const targetFolder = folders[targetFolderId];
    const project = targetFolder ? projects.find(p => p.id === targetFolder.projectId) : null;
    const projectContext = project ? { context: project.context, systemPrompt: project.systemPrompt } : {};

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setAskClarifyingQuestions(true);
            setIsGenerating(false);
            setClarifyingQuestions(null);
            setAnswers({});
            setIgnoredQuestions(new Set());
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description for your story.');
            return;
        }

        const { aiProvider, openRouterKey, anthropicKey } = settings;
        const hasKey = aiProvider === 'anthropic' ? !!anthropicKey : !!openRouterKey;

        if (!hasKey) {
            setError(`Please add your ${aiProvider === 'anthropic' ? 'Anthropic' : 'OpenRouter'} API Key in Settings first.`);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            if (askClarifyingQuestions) {
                const questions = await generateClarifyingQuestions({ title: 'New Story', description: prompt, acceptanceCriteria: '' }, settings, projectContext, 'create');

                if (questions && questions.length > 0) {
                    // Normalize questions to ensure they have id, text, and type
                    const normalizedQuestions = questions.map((q, index) => ({
                        ...q,
                        id: q.id || `question-${index}`,
                        text: q.text || q.question || 'Question text missing',
                        type: q.type || q.format || 'text' // Handle 'format' alias and default to text
                    }));
                    setClarifyingQuestions(normalizedQuestions);
                    setIsGenerating(false);
                    return;
                }
            }

            // If no questions or toggle off, generate directly
            await generateStory(null);

        } catch (err) {
            setError('Failed to generate story: ' + err.message);
            setIsGenerating(false);
        }
    };

    const generateStory = async (qaContext) => {
        try {
            const storyContent = await generateStoryFromPrompt(prompt, settings, projectContext, qaContext);
            onSuccess(storyContent);
        } catch (err) {
            setError('Failed to generate story: ' + err.message);
            setIsGenerating(false);
        }
    };

    const handleSubmitAnswers = async () => {
        setIsGenerating(true);
        setError(null);

        try {
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

            await generateStory(qaContext);

        } catch (err) {
            setError('Failed to generate story: ' + err.message);
            setIsGenerating(false);
        }
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

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: '12px',
                    width: '90%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)'
                }}
            >
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles className="text-accent" />
                        Create Story with AI
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                    {error && (
                        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '4px', marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    {isGenerating ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                            <LoadingAnimation />
                            <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                                {clarifyingQuestions ? 'Generating story...' : 'Analyzing your request...'}
                            </p>
                        </div>
                    ) : clarifyingQuestions ? (
                        <div className="questions-column">
                            <h3 style={{ marginBottom: '1rem', color: 'var(--color-accent)' }}>Clarifying Questions</h3>
                            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
                                The AI has a few questions to better understand your request.
                            </p>

                            {clarifyingQuestions.map((q, index) => {
                                const isIgnored = ignoredQuestions.has(q.id);
                                return (
                                    <div key={q.id || index} style={{ marginBottom: '1.5rem', opacity: isIgnored ? 0.5 : 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <label style={{ display: 'block', fontWeight: '600', textDecoration: isIgnored ? 'line-through' : 'none' }}>{index + 1}. {q.text}</label>
                                            <button
                                                onClick={() => handleIgnoreQuestion(q.id)}
                                                title={isIgnored ? "Include question" : "Ignore question"}
                                                style={{
                                                    background: isIgnored ? 'var(--color-bg-primary)' : 'transparent',
                                                    border: '1px solid var(--color-border)',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    color: isIgnored ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                                                    padding: '4px 8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.85rem',
                                                    marginLeft: '1rem',
                                                    flexShrink: 0
                                                }}
                                            >
                                                {isIgnored ? <Eye size={16} /> : <EyeOff size={16} />}
                                                <span>{isIgnored ? "Include" : "Ignore"}</span>
                                            </button>
                                        </div>

                                        {q.type === 'text' && (
                                            <textarea
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value, 'text')}
                                                rows={3}
                                                style={{ width: '100%', resize: 'vertical' }}
                                                disabled={isIgnored}
                                            />
                                        )}

                                        {q.type === 'single_select' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {q.options?.map((option, i) => {
                                                    const isOther = option === 'Other';
                                                    const isSelected = answers[q.id] === option || (isOther && answers[q.id]?.startsWith('Other'));
                                                    return (
                                                        <div key={i}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${q.id}`}
                                                                    value={option}
                                                                    checked={isSelected}
                                                                    onChange={(e) => handleAnswerChange(q.id, option, 'single_select')}
                                                                    disabled={isIgnored}
                                                                />
                                                                {option}
                                                            </label>
                                                            {isOther && isSelected && (
                                                                <div style={{ marginLeft: '1.7rem', marginTop: '0.5rem' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Please specify..."
                                                                        value={answers[q.id]?.startsWith('Other: ') ? answers[q.id].substring(7) : ''}
                                                                        onChange={(e) => handleAnswerChange(q.id, `Other: ${e.target.value}`, 'single_select')}
                                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                                        autoFocus
                                                                        disabled={isIgnored}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {q.type === 'multi_select' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {q.options?.map((option, i) => {
                                                    const isOther = option === 'Other';
                                                    const currentAnswers = answers[q.id] || [];
                                                    const isSelected = currentAnswers.some(val => val === option || (isOther && val.startsWith('Other')));
                                                    return (
                                                        <div key={i}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    value={option}
                                                                    checked={isSelected}
                                                                    onChange={() => {
                                                                        if (isOther && isSelected) {
                                                                            const valueToRemove = currentAnswers.find(v => v.startsWith('Other'));
                                                                            handleAnswerChange(q.id, valueToRemove, 'multi_select');
                                                                        } else {
                                                                            handleAnswerChange(q.id, option, 'multi_select');
                                                                        }
                                                                    }}
                                                                    disabled={isIgnored}
                                                                />
                                                                {option}
                                                            </label>
                                                            {isOther && isSelected && (
                                                                <div style={{ marginLeft: '1.7rem', marginTop: '0.5rem' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Please specify..."
                                                                        value={currentAnswers.find(v => v.startsWith('Other: '))?.substring(7) || ''}
                                                                        onChange={(e) => {
                                                                            const newValue = `Other: ${e.target.value}`;
                                                                            const oldValue = currentAnswers.find(v => v.startsWith('Other'));
                                                                            handleAnswerChange(q.id, newValue, 'multi_select', oldValue);
                                                                        }}
                                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                                        autoFocus
                                                                        disabled={isIgnored}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Other Notes (Optional)</label>
                                <textarea
                                    value={answers['other_notes'] || ''}
                                    onChange={(e) => handleAnswerChange('other_notes', e.target.value, 'text')}
                                    placeholder="Any other details or corrections..."
                                    rows={3}
                                    style={{ width: '100%', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                Describe the story you want to create. The AI will generate a title, description, and acceptance criteria for you.
                            </p>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="E.g., As a user, I want to be able to reset my password so that I can regain access to my account if I forget it..."
                                style={{
                                    width: '100%',
                                    minHeight: '200px',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    marginBottom: '1.5rem',
                                    resize: 'vertical'
                                }}
                                autoFocus
                            />

                            <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}
                                onClick={() => setAskClarifyingQuestions(!askClarifyingQuestions)}
                            >
                                <div style={{
                                    width: '44px',
                                    height: '24px',
                                    backgroundColor: askClarifyingQuestions ? 'var(--color-accent)' : 'var(--color-border)',
                                    borderRadius: '12px',
                                    position: 'relative',
                                    transition: 'background-color 0.2s',
                                    flexShrink: 0
                                }}>
                                    <motion.div
                                        initial={false}
                                        animate={{ x: askClarifyingQuestions ? 22 : 2 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            position: 'absolute',
                                            top: '2px',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                        }}
                                    />
                                </div>
                                <label style={{ fontSize: '1rem', cursor: 'pointer', userSelect: 'none' }}>
                                    Ask clarifying questions
                                </label>
                            </div>
                        </>
                    )}
                </div>

                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    {clarifyingQuestions ? (
                        <button
                            onClick={handleSubmitAnswers}
                            disabled={isGenerating}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: 'var(--color-accent)',
                                color: 'white',
                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                opacity: isGenerating ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {isGenerating ? 'Generating...' : 'Submit & Create'}
                        </button>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={!prompt.trim() || isGenerating}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: 'var(--color-accent)',
                                color: 'white',
                                cursor: (!prompt.trim() || isGenerating) ? 'not-allowed' : 'pointer',
                                opacity: (!prompt.trim() || isGenerating) ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Sparkles size={18} />
                            {isGenerating ? 'Processing...' : 'Generate Story'}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CreateStoryAIModal;
