import React, { useState } from 'react';
import { useStore } from '../store';
import { Folder, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CheckboxFolderItem = ({ folderId, depth = 0, selectedStoryIds, onToggleStory }) => {
    const { folders, stories } = useStore();
    const folder = folders[folderId];
    const [isOpen, setIsOpen] = useState(true);

    if (!folder || folder.deleted) return null;

    return (
        <div style={{ marginLeft: depth > 0 ? '12px' : '0' }}>
            <motion.div
                layout
                initial={false}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    marginBottom: '2px'
                }}
                className="folder-row"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    style={{ padding: 0, background: 'transparent', border: 'none', marginRight: '0.25rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronRight size={14} />
                    </motion.div>
                </button>
                <Folder size={14} style={{ marginRight: '0.5rem', color: 'var(--color-accent)' }} />
                <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
            </motion.div>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        style={{ overflow: 'hidden' }}
                    >
                        {folder.children.map(childId => (
                            <CheckboxFolderItem
                                key={childId}
                                folderId={childId}
                                depth={depth + 1}
                                selectedStoryIds={selectedStoryIds}
                                onToggleStory={onToggleStory}
                            />
                        ))}

                        {folder.stories.map(storyId => {
                            const story = stories[storyId];
                            if (!story || story.deleted) return null;
                            const isSelected = selectedStoryIds.includes(storyId);

                            return (
                                <div
                                    key={storyId}
                                    style={{
                                        marginLeft: '24px',
                                        padding: '0.25rem 0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => onToggleStory(storyId)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => { }} // Handled by parent div click
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <FileText size={14} style={{ color: 'var(--color-text-secondary)' }} />
                                    <span style={{
                                        fontSize: '0.9rem',
                                        color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {story.title}
                                    </span>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const CheckboxFolderTree = ({ rootFolderId, selectedStoryIds, onToggleStory }) => {
    const { folders, stories } = useStore();
    const rootFolder = folders[rootFolderId];

    if (!rootFolder) return null;

    return (
        <div style={{ marginTop: '0.5rem' }}>
            {rootFolder.children.map(childId => (
                <CheckboxFolderItem
                    key={childId}
                    folderId={childId}
                    depth={0}
                    selectedStoryIds={selectedStoryIds}
                    onToggleStory={onToggleStory}
                />
            ))}

            {rootFolder.stories.map(storyId => {
                const story = stories[storyId];
                if (!story || story.deleted) return null;
                const isSelected = selectedStoryIds.includes(storyId);

                return (
                    <div
                        key={storyId}
                        style={{
                            marginLeft: '12px',
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        onClick={() => onToggleStory(storyId)}
                    >
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }} // Handled by parent div click
                            style={{ cursor: 'pointer' }}
                        />
                        <FileText size={14} style={{ color: 'var(--color-text-secondary)' }} />
                        <span style={{
                            fontSize: '0.9rem',
                            color: isSelected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {story.title}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default CheckboxFolderTree;
