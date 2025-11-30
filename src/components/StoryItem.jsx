import React, { useState } from 'react';
import { useStore } from '../store';
import { useToast } from '../contexts/ToastContext';
import { FileText, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Menu from './Menu';

const StoryItem = ({ storyId, onSelectStory, selectedStoryId, marginLeft = '24px' }) => {
    const { stories, deleteStory, restoreStory, unsavedStories, drafts, duplicateStory } = useStore();
    const { showToast } = useToast();
    const story = stories[storyId];
    const [activeMenu, setActiveMenu] = useState(null);

    if (!story) return null;

    const handleMenuOpen = (e, id, type) => {
        e.stopPropagation();
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        setActiveMenu({
            id,
            type,
            position: { x: rect.right + 5, y: rect.top }
        });
    };

    const handleMenuAction = (action, id) => {
        switch (action) {
            case 'duplicate-story':
                duplicateStory(id);
                break;
            case 'delete-story':
                deleteStory(id);
                showToast('Story deleted', 'success', {
                    label: 'Undo',
                    onClick: () => restoreStory(id)
                });
                break;
        }
        setActiveMenu(null);
    };

    const handleDragStart = (e, storyId) => {
        e.stopPropagation();
        e.dataTransfer.setData('storyId', storyId);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <motion.div
            layout
            onClick={() => onSelectStory(storyId)}
            draggable
            onDragStart={(e) => handleDragStart(e, storyId)}
            style={{
                marginLeft,
                padding: '0.35rem 0.5rem',
                display: 'flex',
                alignItems: 'center',
                cursor: 'grab',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: selectedStoryId === storyId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                backgroundColor: selectedStoryId === storyId ? 'var(--color-accent-glow)' : 'rgba(255, 255, 255, 0)',
                fontWeight: selectedStoryId === storyId ? 500 : 400,
                justifyContent: 'space-between',
                border: selectedStoryId === storyId ? '1px solid var(--color-accent)' : '1px solid transparent',
                marginBottom: '2px'
            }}
            className="story-row"
            whileHover={{
                backgroundColor: selectedStoryId === storyId ? 'var(--color-accent-glow)' : 'rgba(255, 255, 255, 0.05)',
                scale: 1.01,
                x: 2
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <FileText size={12} style={{ marginRight: '0.5rem', minWidth: '12px', color: drafts[storyId] ? 'var(--color-warning)' : 'var(--color-success)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</span>
                {unsavedStories[storyId] && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', marginLeft: '6px', flexShrink: 0 }} title="Unsaved Changes"></div>
                )}
            </div>
            <button
                onClick={(e) => handleMenuOpen(e, storyId, 'story')}
                className="story-actions"
                style={{
                    padding: '0.1rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    opacity: 0.6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <MoreVertical size={12} />
            </button>
            {activeMenu && activeMenu.id === storyId && activeMenu.type === 'story' && (
                <Menu
                    isOpen={true}
                    onClose={() => setActiveMenu(null)}
                    position={activeMenu.position}
                    items={[
                        { label: 'Duplicate Story', icon: <Copy size={14} />, onClick: () => handleMenuAction('duplicate-story', storyId) },
                        { label: 'Delete Story', icon: <Trash2 size={14} />, onClick: () => handleMenuAction('delete-story', storyId), danger: true },
                    ]}
                />
            )}
        </motion.div>
    );
};

export default StoryItem;
