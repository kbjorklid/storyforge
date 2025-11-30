import React, { useState } from 'react';
import { useStore } from '../store';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, Trash2, MoreVertical, Edit2, Copy } from 'lucide-react';
import Menu from './Menu';

const FolderItem = ({ folderId, depth = 0, onSelectStory, selectedStoryId, searchTerm = '' }) => {
    const { folders, stories, addFolder, addStory, deleteStory, moveStory, moveFolder, unsavedStories, deleteFolder, updateFolder, drafts, duplicateStory } = useStore();
    const folder = folders[folderId];
    const [isOpen, setIsOpen] = useState(true);
    const [isAdding, setIsAdding] = useState(null); // 'folder' or 'story'
    const [newItemName, setNewItemName] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null); // { position: { x, y } }

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

    if (!folder || folder.deleted || !isVisible) return null;

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
        e.stopPropagation();
        e.dataTransfer.setData('storyId', storyId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragStartFolder = (e) => {
        e.stopPropagation();
        e.dataTransfer.setData('folderId', folderId);
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
        e.stopPropagation();
        setIsDragOver(false);
        const storyId = e.dataTransfer.getData('storyId');
        const droppedFolderId = e.dataTransfer.getData('folderId');

        if (storyId) {
            moveStory(storyId, folderId);
            setIsOpen(true);
        } else if (droppedFolderId) {
            moveFolder(droppedFolderId, folderId);
            setIsOpen(true);
        }
    };

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
            case 'new-folder':
                setIsAdding('folder');
                setIsOpen(true);
                break;
            case 'new-story':
                setIsAdding('story');
                setIsOpen(true);
                break;
            case 'rename': {
                const name = prompt('New Folder Name:', folder.name);
                if (name && name.trim()) {
                    updateFolder(folderId, { name: name.trim() });
                }
                break;
            }
            case 'delete':
                if (confirm('Are you sure you want to delete this folder and all its contents?')) {
                    deleteFolder(folderId);
                }
                break;
            case 'delete-story':
                if (confirm('Are you sure you want to delete this story?')) {
                    deleteStory(id);
                }
                break;
            case 'duplicate-story':
                duplicateStory(id);
                break;
        }
        setActiveMenu(null);
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
                draggable
                onDragStart={handleDragStartFolder}
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

                <button
                    onClick={(e) => handleMenuOpen(e, folderId, 'folder')}
                    style={{
                        padding: '0.1rem',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.6
                    }}
                    className="folder-actions"
                >
                    <MoreVertical size={14} />
                </button>

                {activeMenu && activeMenu.id === folderId && activeMenu.type === 'folder' && (
                    <Menu
                        isOpen={true}
                        onClose={() => setActiveMenu(null)}
                        position={activeMenu.position}
                        items={[
                            { label: 'New Folder', icon: <Folder size={14} />, onClick: () => handleMenuAction('new-folder') },
                            { label: 'New Story', icon: <FileText size={14} />, onClick: () => handleMenuAction('new-story') },
                            { label: 'Rename Folder', icon: <Edit2 size={14} />, onClick: () => handleMenuAction('rename') },
                            { label: 'Delete Folder', icon: <Trash2 size={14} />, onClick: () => handleMenuAction('delete'), danger: true },
                        ]}
                    />
                )}
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
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const FolderTree = ({ rootFolderId, onSelectStory, selectedStoryId, searchTerm }) => {
    const { folders, stories, deleteStory, unsavedStories, drafts, duplicateStory } = useStore();
    const rootFolder = folders[rootFolderId];
    const [activeMenu, setActiveMenu] = useState(null);

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
            case 'delete-story':
                if (confirm('Are you sure you want to delete this story?')) {
                    deleteStory(id);
                }
                break;
            case 'duplicate-story':
                duplicateStory(id);
                break;
        }
        setActiveMenu(null);
    };

    if (!rootFolder) return null;

    // Filter stories based on search term (logic duplicated from FolderItem for root level)
    const filteredStories = rootFolder.stories.filter(storyId => {
        const story = stories[storyId];
        if (!story || story.deleted) return false;
        if (!searchTerm) return true;
        return story.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleDragStart = (e, storyId) => {
        e.stopPropagation();
        e.dataTransfer.setData('storyId', storyId);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{ marginTop: '0.5rem' }}>
            {rootFolder.children.map(childId => (
                <FolderItem
                    key={childId}
                    folderId={childId}
                    depth={0}
                    onSelectStory={onSelectStory}
                    selectedStoryId={selectedStoryId}
                    searchTerm={searchTerm}
                />
            ))}

            {filteredStories.map(storyId => {
                const story = stories[storyId];
                if (!story) return null;

                return (
                    <div
                        key={storyId}
                        onClick={() => onSelectStory(storyId)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, storyId)}
                        style={{
                            marginLeft: '12px', // Match depth 0 indentation
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
                    </div>
                );
            })}
        </div>
    );
};

export default FolderTree;
