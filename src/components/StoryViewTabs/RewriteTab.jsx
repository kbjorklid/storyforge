import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, EyeOff, Eye } from 'lucide-react';
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
    setClarifyingQuestions,
    ignoredQuestions,
    handleIgnoreQuestion,
    onCancel
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
                        <label style={{ fontSize: '1.1rem', cursor: 'pointer', userSelect: 'none' }}>
                            Ask clarifying questions
                        </label>
                    </div>
                    {unsavedStories[storyId] && (
                        <p style={{ color: 'var(--color-warning)', marginBottom: '1rem', fontStyle: 'italic' }}>
                            Note: Proceeding will save your current changes.
                        </p>
                    )}

                    {(!rewriteSelection.title && !rewriteSelection.description && !rewriteSelection.acceptanceCriteria) && (
                        <p style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Please select at least one part of the story to rewrite.
                        </p>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleImprove}
                        disabled={!rewriteSelection.title && !rewriteSelection.description && !rewriteSelection.acceptanceCriteria}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: (!rewriteSelection.title && !rewriteSelection.description && !rewriteSelection.acceptanceCriteria) ? 'var(--color-text-tertiary)' : 'var(--color-accent)',
                            fontSize: '1.1rem',
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: (!rewriteSelection.title && !rewriteSelection.description && !rewriteSelection.acceptanceCriteria) ? 'not-allowed' : 'pointer',
                            opacity: (!rewriteSelection.title && !rewriteSelection.description && !rewriteSelection.acceptanceCriteria) ? 0.7 : 1
                        }}
                    >
                        <Sparkles size={20} />
                        Improve with AI
                    </motion.button>
                </div>
            ) : isImproving ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <LoadingAnimation />
                    <button
                        onClick={onCancel}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.target.style.borderColor = 'var(--color-danger)';
                            e.target.style.color = 'var(--color-danger)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.borderColor = 'var(--color-border)';
                            e.target.style.color = 'var(--color-text-secondary)';
                        }}
                    >
                        Cancel Generation
                    </button>
                </div>
            ) : clarifyingQuestions ? (
                <div className="questions-column" style={{ border: '1px solid var(--color-accent)', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} /> Clarifying Questions
                    </h3>
                    <p style={{ marginBottom: '1.5rem' }}>Please answer the following questions to help the AI improve your story.</p>

                    {clarifyingQuestions.map((q, index) => {
                        const isIgnored = ignoredQuestions?.has(q.id);
                        return (
                            <div key={q.id || index} style={{ marginBottom: '1.5rem', opacity: isIgnored ? 0.5 : 1, transition: 'opacity 0.2s' }}>
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
                                            flexShrink: 0,
                                            transition: 'all 0.2s'
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
        </motion.div >
    );
};

export default RewriteTab;
