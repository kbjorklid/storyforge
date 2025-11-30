import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import LoadingAnimation from '../LoadingAnimation';

const RewriteTab = ({
    storyId,
    unsavedStories,
    isImproving,
    aiSuggestion,
    error,
    clarifyingQuestions,
    answers,
    rewriteSelection,
    setRewriteSelection,
    askClarifyingQuestions,
    setAskClarifyingQuestions,
    handleImprove,
    handleSubmitAnswers,
    handleAnswerChange,
    applySuggestion,
    rejectSuggestion,
    setClarifyingQuestions
}) => {
    return (
        <motion.div
            key="rewrite"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="rewrite-column"
            style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}
        >
            {!aiSuggestion && !isImproving && !clarifyingQuestions ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.8 }}>
                    <Sparkles size={48} color="var(--color-accent)" />
                    <p style={{ fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px' }}>
                        Use AI to rewrite and improve your story. Select which parts you want to rewrite.
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={rewriteSelection.title}
                                onChange={(e) => setRewriteSelection(prev => ({ ...prev, title: e.target.checked }))}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            Title
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={rewriteSelection.description}
                                onChange={(e) => setRewriteSelection(prev => ({ ...prev, description: e.target.checked }))}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            Description
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={rewriteSelection.acceptanceCriteria}
                                onChange={(e) => setRewriteSelection(prev => ({ ...prev, acceptanceCriteria: e.target.checked }))}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            Acceptance Criteria
                        </label>
                    </div>

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
                    {unsavedStories[storyId] && (
                        <p style={{ color: 'var(--color-warning)', marginBottom: '1rem', fontStyle: 'italic' }}>
                            Note: Proceeding will save your current changes.
                        </p>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleImprove}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-accent)', fontSize: '1.1rem', padding: '0.75rem 1.5rem', border: 'none', color: 'white', borderRadius: '8px' }}
                    >
                        <Sparkles size={20} />
                        Improve with AI
                    </motion.button>
                </div>
            ) : isImproving ? (
                <LoadingAnimation text={clarifyingQuestions ? 'Generating rewrite...' : 'Processing...'} />
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
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSubmitAnswers} style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px' }}>Submit Answers & Rewrite</motion.button>
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
                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {aiSuggestion.description}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Acceptance Criteria:</strong>
                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {aiSuggestion.acceptanceCriteria}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                        <button onClick={rejectSuggestion} style={{ backgroundColor: 'var(--color-danger)', color: 'white', padding: '0.75rem 1.5rem' }}>Reject</button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={applySuggestion} style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px' }}>Accept Changes</motion.button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default RewriteTab;
