import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Save, Copy, Check } from 'lucide-react';
import CopyControl from '../CopyControl';

const EditTab = ({
    storyId,
    formData,
    handleChange,
    handleSave,
    handleDiscard,
    unsavedStories,
    drafts
}) => {
    const [isCopied, setIsCopied] = React.useState(false);

    const handleCopy = async () => {
        const { title, description, acceptanceCriteria } = formData;
        let textToCopy = `# ${title}\n\n${description}`;

        if (acceptanceCriteria && acceptanceCriteria.trim()) {
            textToCopy += `\n\n## Acceptance Criteria\n\n${acceptanceCriteria}`;
        }

        try {
            await navigator.clipboard.writeText(textToCopy);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <motion.div
            key="edit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="editor-column"
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    {unsavedStories[storyId] && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-warning)' }}>
                            {drafts[storyId] ? 'Unsaved Draft Restored' : 'Unsaved Changes'}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleCopy}
                        aria-label={isCopied ? "Copied to clipboard" : "Copy whole story"}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'var(--color-bg-secondary)',
                            border: '1px solid var(--color-border)',
                            color: isCopied ? 'var(--color-success)' : 'var(--color-text)',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                        {isCopied ? 'Copied!' : 'Copy Story'}
                    </button>
                    {unsavedStories[storyId] && (
                        <button
                            onClick={handleDiscard}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text)',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            <RotateCcw size={16} /> Discard Changes
                        </button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={!unsavedStories[storyId]}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: unsavedStories[storyId] ? 1 : 0.5,
                            cursor: unsavedStories[storyId] ? 'pointer' : 'default',
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem'
                        }}
                    >
                        <Save size={16} /> Save
                    </motion.button>
                </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: '500', margin: 0 }}>Title</label>
                    <CopyControl text={formData.title} />
                </div>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    style={{ width: '100%', fontSize: '1.1rem' }}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: '500', margin: 0 }}>Description</label>
                    <CopyControl text={formData.description} />
                </div>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    style={{ width: '100%', resize: 'vertical' }}
                />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label style={{ fontWeight: '500', margin: 0 }}>Acceptance Criteria</label>
                    <CopyControl text={formData.acceptanceCriteria} />
                </div>
                <textarea
                    name="acceptanceCriteria"
                    value={formData.acceptanceCriteria}
                    onChange={handleChange}
                    rows={8}
                    style={{ width: '100%', resize: 'vertical' }}
                />
            </div>
            <div aria-live="polite" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                {isCopied ? 'Story copied to clipboard' : ''}
            </div>
        </motion.div>
    );
};

export default EditTab;
