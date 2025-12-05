import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Sparkles, EyeOff, Eye } from 'lucide-react';
import LoadingAnimation from '../LoadingAnimation';

const SplitTab = ({
    story,
    storyId,
    unsavedStories,
    isSplitting,
    splitStories,
    setSplitStories,
    splitInstructions,
    setSplitInstructions,
    askSplitClarifyingQuestions,
    setAskSplitClarifyingQuestions,
    splitClarifyingQuestions,
    setSplitClarifyingQuestions,
    splitAnswers,
    handleSplitAnswerChange,
    handleSubmitSplitAnswers,
    handleSplit,
    handleAcceptSplit,
    createSubfolder,
    setCreateSubfolder,
    subfolderName,
    setSubfolderName,
    activeSplitTab,
    setActiveSplitTab,
    handleReSplit,
    ignoredQuestions,
    handleIgnoreQuestion,
    retainOriginal,
    setRetainOriginal,
    onCancel
}) => {
    return (
        <motion.div
            key="split"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="split-column"
            style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}
        >
            {!splitStories && !isSplitting && !splitClarifyingQuestions ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.8 }}>
                    <Scissors size={48} color="var(--color-accent)" />
                    <p style={{ fontSize: '1.1rem', textAlign: 'center', maxWidth: '400px' }}>
                        Use AI to split this story into multiple smaller, independent stories.
                    </p>

                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}
                        onClick={() => setAskSplitClarifyingQuestions(!askSplitClarifyingQuestions)}
                    >
                        <div style={{
                            width: '44px',
                            height: '24px',
                            backgroundColor: askSplitClarifyingQuestions ? 'var(--color-accent)' : 'var(--color-border)',
                            borderRadius: '12px',
                            position: 'relative',
                            transition: 'background-color 0.2s',
                            flexShrink: 0
                        }}>
                            <motion.div
                                initial={false}
                                animate={{ x: askSplitClarifyingQuestions ? 22 : 2 }}
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
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSplit}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-accent)', fontSize: '1.1rem', padding: '0.75rem 1.5rem', border: 'none', color: 'white', borderRadius: '8px' }}
                    >
                        <Scissors size={20} />
                        Split Story
                    </motion.button>
                </div>
            ) : splitStories ? (
                <div className="split-results-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', minHeight: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <h3 style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Scissors size={20} /> Split Results
                        </h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => setSplitStories(null)} style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', padding: '0.5rem 1rem' }}>Back</button>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAcceptSplit} style={{ backgroundColor: 'var(--color-success)', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '8px' }}>Accept Split</motion.button>
                        </div>
                    </div>



                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="createSubfolder"
                                checked={createSubfolder}
                                onChange={(e) => setCreateSubfolder(e.target.checked)}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            <label htmlFor="createSubfolder" style={{ fontSize: '1rem', cursor: 'pointer', userSelect: 'none' }}>
                                Create subfolder for split stories
                            </label>
                        </div>

                        {createSubfolder && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ marginLeft: '1.6rem' }}
                            >
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Subfolder Name</label>
                                <input
                                    type="text"
                                    value={subfolderName}
                                    onChange={(e) => setSubfolderName(e.target.value)}
                                    placeholder="e.g. User Management"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                />
                            </motion.div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="retainOriginal"
                                checked={retainOriginal}
                                onChange={(e) => setRetainOriginal(e.target.checked)}
                                style={{ width: '1.1rem', height: '1.1rem' }}
                            />
                            <label htmlFor="retainOriginal" style={{ fontSize: '1rem', cursor: 'pointer', userSelect: 'none' }}>
                                Preserve original story
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                        {/* Master List */}
                        <div style={{
                            width: '280px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            borderRight: '1px solid var(--color-border)'
                        }}>
                            {/* Original Story Button */}
                            <button
                                onClick={() => setActiveSplitTab(0)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: activeSplitTab === 0 ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                                    color: activeSplitTab === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                    border: activeSplitTab === 0 ? '1px solid var(--color-border)' : '1px solid transparent',
                                    borderRadius: '8px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.95rem',
                                    fontWeight: activeSplitTab === 0 ? '600' : '400',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem',
                                    borderBottom: '1px solid var(--color-border)'
                                }}
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                                    Original Story
                                </span>
                            </button>

                            {splitStories.map((story, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveSplitTab(index + 1)}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        backgroundColor: activeSplitTab === index + 1 ? 'var(--color-accent)' : 'var(--color-bg-primary)',
                                        color: activeSplitTab === index + 1 ? 'white' : 'var(--color-text-primary)',
                                        border: activeSplitTab === index + 1 ? '1px solid var(--color-accent)' : '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontSize: '0.95rem',
                                        fontWeight: activeSplitTab === index + 1 ? '600' : '400',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {story.title || `Split Story ${index + 1}`}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Detail View */}
                        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {activeSplitTab === 0 ? (
                                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)', opacity: 0.8 }}>
                                    <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-tertiary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Original Story (Read Only)
                                    </div>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>{story?.title}</h4>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Description</strong>
                                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '6px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                            {story?.description}
                                        </div>
                                    </div>

                                    <div>
                                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Acceptance Criteria</strong>
                                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '6px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                            {story?.acceptanceCriteria}
                                        </div>
                                    </div>
                                </div>
                            ) : activeSplitTab > 0 && splitStories[activeSplitTab - 1] ? (
                                <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>{splitStories[activeSplitTab - 1].title}</h4>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Description</strong>
                                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                            {splitStories[activeSplitTab - 1].description}
                                        </div>
                                    </div>

                                    <div>
                                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>Acceptance Criteria</strong>
                                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                                            {splitStories[activeSplitTab - 1].acceptanceCriteria}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                                    Select a story to view details
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)', flexShrink: 0, marginTop: 'auto' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Refine Split Instructions (Optional)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={splitInstructions}
                                onChange={(e) => setSplitInstructions(e.target.value)}
                                placeholder="e.g. Split into 3 parts, focus on frontend vs backend..."
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleReSplit}
                                style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', whiteSpace: 'nowrap' }}
                            >
                                Re-Split
                            </motion.button>
                        </div>
                    </div>
                </div>
            ) : isSplitting ? (
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
            ) : splitClarifyingQuestions ? (
                <div className="questions-column" style={{ border: '1px solid var(--color-accent)', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={20} /> Clarifying Questions
                    </h3>
                    <p style={{ marginBottom: '1.5rem' }}>Please answer the following questions to help the AI split your story effectively.</p>

                    {splitClarifyingQuestions.map((q, index) => {
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
                                        value={splitAnswers[q.id] || ''}
                                        onChange={(e) => handleSplitAnswerChange(q.id, e.target.value, 'text')}
                                        rows={3}
                                        style={{ width: '100%', resize: 'vertical' }}
                                        disabled={isIgnored}
                                    />
                                )}

                                {q.type === 'single_select' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {q.options?.map((option, i) => {
                                            const isOther = option === 'Other';
                                            const isSelected = splitAnswers[q.id] === option || (isOther && splitAnswers[q.id]?.startsWith('Other'));

                                            return (
                                                <div key={i}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                        <input
                                                            type="radio"
                                                            name={`question-${q.id}`}
                                                            value={option}
                                                            checked={isSelected}
                                                            onChange={(e) => handleSplitAnswerChange(q.id, option, 'single_select')}
                                                            disabled={isIgnored}
                                                        />
                                                        {option}
                                                    </label>
                                                    {isOther && isSelected && (
                                                        <div style={{ marginLeft: '1.7rem', marginTop: '0.5rem' }}>
                                                            <input
                                                                type="text"
                                                                placeholder="Please specify..."
                                                                value={splitAnswers[q.id]?.startsWith('Other: ') ? splitAnswers[q.id].substring(7) : ''}
                                                                onChange={(e) => handleSplitAnswerChange(q.id, `Other: ${e.target.value}`, 'single_select')}
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
                                            const currentAnswers = splitAnswers[q.id] || [];
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
                                                                    handleSplitAnswerChange(q.id, valueToRemove, 'multi_select');
                                                                } else {
                                                                    handleSplitAnswerChange(q.id, option, 'multi_select');
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
                                                                    handleSplitAnswerChange(q.id, newValue, 'multi_select', oldValue);
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
                            value={splitAnswers['other_notes'] || ''}
                            onChange={(e) => handleSplitAnswerChange('other_notes', e.target.value, 'text')}
                            placeholder="Any other details or corrections..."
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setSplitClarifyingQuestions(null)} style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', padding: '0.75rem 1.5rem' }}>Cancel</button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSubmitSplitAnswers} style={{ backgroundColor: 'var(--color-accent)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px' }}>Submit Answers & Split</motion.button>
                    </div>
                </div>
            ) : null}
        </motion.div>
    );
};

export default SplitTab;
