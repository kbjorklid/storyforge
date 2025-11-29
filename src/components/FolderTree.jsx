import React, { useState } from 'react';
import { useStore } from '../store';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-react';

const FolderItem = ({ folderId, depth = 0, onSelectStory, selectedStoryId, searchTerm = '' }) => {
    const { folders, stories, addFolder, addStory, deleteStory, moveStory, unsavedStories } = useStore();
    const folder = folders[folderId];
    const [isOpen, setIsOpen] = useState(true);
    const [isAdding, setIsAdding] = useState(null); // 'folder' or 'story'
    const [newItemName, setNewItemName] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);

    // Filter stories based on search term
    const filteredStories = folder ? folder.stories.filter(storyId => {
        const story = stories[storyId];
        if (!story || story.deleted) return false;
        if (!searchTerm) return true;
        return story.title.toLowerCase().includes(searchTerm.toLowerCase());
    }) : [];

    // Check if any children (subfolders) have matching content
    const hasMatchingChildren = React.useMemo(() => {
        if (!folder || !searchTerm) return true;

        const checkFolder = (fId) => {
            const f = folders[fId];
            if (!f) return false;

            // Check stories in this folder
            const hasMatchingStories = f.stories.some(sId => {
                const s = stories[sId];
                return s && !s.deleted && s.title.toLowerCase().includes(searchTerm.toLowerCase());
            });
            if (hasMatchingStories) return true;

            // Check subfolders recursively
            return f.children.some(childId => checkFolder(childId));
        };

        return folder.children.some(childId => checkFolder(childId));
    }, [folder, folders, stories, searchTerm]);

    // Determine visibility
    const hasMatches = filteredStories.length > 0 || hasMatchingChildren;
    const isVisible = !searchTerm || hasMatches;

    // Auto-expand if searching and has matches
    React.useEffect(() => {
        if (searchTerm && hasMatches) {
            setIsOpen(true);
        }
    }, [searchTerm, hasMatches]);

    if (!folder || !isVisible) return null;

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

    const handleDragStart = (e, storyId) => {
        e.dataTransfer.setData('storyId', storyId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const storyId = e.dataTransfer.getData('storyId');
        if (storyId) {
            moveStory(storyId, folderId);
            setIsOpen(true); // Open folder to show dropped item
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
                    color: 'var(--color-text-primary)',
                    backgroundColor: isDragOver ? 'var(--color-bg-tertiary)' : 'transparent',
                    border: isDragOver ? '1px dashed var(--color-accent)' : '1px solid transparent'
                }}
                className="folder-row"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                        <FolderItem
                            key={childId}
                            folderId={childId}
                            depth={depth + 1}
                            onSelectStory={onSelectStory}
                            selectedStoryId={selectedStoryId}
                            searchTerm={searchTerm}
                        />
                    ))}

                    {filteredStories.map(storyId => {
                        const story = stories[storyId];
                        // Double check existence (though filteredStories should handle it)
                        if (!story) return null;

                        return (
                            <div
                                key={storyId}
                                onClick={() => onSelectStory(storyId)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, storyId)}
                                style={{
                                    marginLeft: '24px',
                                    padding: '0.25rem 0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'grab',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    color: selectedStoryId === storyId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                    backgroundColor: selectedStoryId === storyId ? 'var(--color-bg-tertiary)' : 'transparent',
                                    fontWeight: selectedStoryId === storyId ? 500 : 400,
                                    justifyContent: 'space-between'
                                }}
                                className="story-row"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                    <FileText size={12} style={{ marginRight: '0.5rem', minWidth: '12px' }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</span>
                                    {unsavedStories[storyId] && (
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', marginLeft: '6px', flexShrink: 0 }}></div>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteStory(storyId);
                                    }}
                                    className="delete-btn"
                                    style={{
                                        padding: '0.1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--color-text-secondary)',
                                        opacity: 0.6,
                                        cursor: 'pointer'
                                    }}
                                    title="Delete Story"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const FolderTree = ({ rootFolderId, onSelectStory, selectedStoryId, searchTerm }) => {
    return (
        <div style={{ marginTop: '0.5rem' }}>
            <FolderItem
                folderId={rootFolderId}
                onSelectStory={onSelectStory}
                selectedStoryId={selectedStoryId}
                searchTerm={searchTerm}
            />
        </div>
    );
};

export default FolderTree;
