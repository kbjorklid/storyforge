import React, { useState } from 'react';
import { useStore } from '../store';
import { Folder, FileText, ChevronRight, ChevronDown, Plus } from 'lucide-react';

const FolderItem = ({ folderId, depth = 0, onSelectStory }) => {
    const { folders, stories, addFolder, addStory } = useStore();
    const folder = folders[folderId];
    const [isOpen, setIsOpen] = useState(true);
    const [isAdding, setIsAdding] = useState(null); // 'folder' or 'story'
    const [newItemName, setNewItemName] = useState('');

    if (!folder) return null;

    const handleAdd = (type) => {
        if (newItemName.trim()) {
            if (type === 'folder') {
                addFolder(null, folderId, newItemName, folder.projectId);
            } else {
                const newStoryId = addStory(folderId, newItemName, '', '');
                if (newStoryId) {
                    onSelectStory(newStoryId);
                }
            }
            setNewItemName('');
            setIsAdding(null);
        }
    };

    return (
        <div style={{ marginLeft: depth > 0 ? '12px' : '0' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)'
                }}
                className="folder-row"
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    style={{ padding: 0, background: 'transparent', border: 'none', marginRight: '0.25rem', color: 'var(--color-text-secondary)' }}
                >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <Folder size={14} style={{ marginRight: '0.5rem', color: 'var(--color-accent)' }} />
                <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>

                <div className="folder-actions" style={{ display: 'flex', gap: '0.25rem', opacity: 0.6 }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAdding('folder');
                            setIsOpen(true);
                        }}
                        title="Add Subfolder"
                        style={{ padding: '0.1rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)' }}
                    >
                        <Plus size={12} />F
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAdding('story');
                            setIsOpen(true);
                        }}
                        title="Add Story"
                        style={{ padding: '0.1rem', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)' }}
                    >
                        <Plus size={12} />S
                    </button>
                </div>
            </div>

            {isOpen && (
                <div>
                    {isAdding && (
                        <div style={{ marginLeft: '12px', padding: '0.25rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                            <input
                                autoFocus
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={`Name...`}
                                style={{
                                    width: '100%',
                                    fontSize: '0.8rem',
                                    padding: '0.1rem 0.25rem',
                                    background: 'var(--color-bg-primary)',
                                    border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-primary)'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAdd(isAdding);
                                    if (e.key === 'Escape') setIsAdding(null);
                                }}
                                onBlur={() => {
                                    // Optional: cancel on blur or keep it? Let's keep it simple for now.
                                    // setIsAdding(null); 
                                }}
                            />
                        </div>
                    )}

                    {folder.children.map(childId => (
                        <FolderItem key={childId} folderId={childId} depth={depth + 1} onSelectStory={onSelectStory} />
                    ))}

                    {folder.stories.map(storyId => {
                        const story = stories[storyId];
                        if (!story) return null;
                        return (
                            <div
                                key={storyId}
                                onClick={() => onSelectStory(storyId)}
                                style={{
                                    marginLeft: '24px',
                                    padding: '0.25rem 0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    color: 'var(--color-text-secondary)'
                                }}
                                className="story-row"
                            >
                                <FileText size={12} style={{ marginRight: '0.5rem', minWidth: '12px' }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const FolderTree = ({ rootFolderId, onSelectStory }) => {
    return (
        <div style={{ marginTop: '0.5rem' }}>
            <FolderItem folderId={rootFolderId} onSelectStory={onSelectStory} />
        </div>
    );
};

export default FolderTree;
