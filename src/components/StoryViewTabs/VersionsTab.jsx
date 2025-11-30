import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Scissors } from 'lucide-react';
import VersionGraph from '../VersionGraph';

const VersionsTab = ({
    story,
    storyId,
    selectedVersionId,
    handleVersionSelect,
    drafts,
    handleRestore,
    unsavedStories,
    handleSplit
}) => {
    const selectedVersion = story.versions && selectedVersionId ? story.versions[selectedVersionId] : null;

    return (
        <motion.div
            key="versions"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="versions-column"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}
        >
            <div style={{ height: '400px', flexShrink: 0 }}>
                <VersionGraph
                    versions={story.versions}
                    currentVersionId={story.currentVersionId}
                    selectedVersionId={selectedVersionId}
                    onSelect={handleVersionSelect}
                    draft={drafts[storyId]}
                />
            </div>

            {selectedVersion && (
                <div style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px', backgroundColor: 'var(--color-bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Version Preview</h3>
                        {selectedVersionId !== story.currentVersionId && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleRestore}
                                style={{
                                    backgroundColor: 'var(--color-accent)',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    border: 'none',
                                    borderRadius: '8px'
                                }}
                            >
                                <GitBranch size={16} /> Restore this Version
                            </motion.button>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Title:</strong> {selectedVersion.title}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Description:</strong>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '4px', marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {selectedVersion.description}
                        </div>
                    </div>
                    <div>
                        <strong>Acceptance Criteria:</strong>
                        <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-bg-primary)', borderRadius: '4px', marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {selectedVersion.acceptanceCriteria}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default VersionsTab;
