import React, { useState } from 'react';
import { useStore } from '../store';
import { Folder, FileText, ChevronRight, ChevronDown, Plus, Trash2, MoreVertical, Edit2, Copy } from 'lucide-react';
import Menu from './Menu';
import StoryItem from './StoryItem';

const FolderItem = ({ folderId, depth = 0, onSelectStory, selectedStoryId, searchTerm = '' }) => {
    const { folders, stories, addFolder, addStory, moveStory, moveFolder, deleteFolder, updateFolder } = useStore();
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

    const handleMenuAction = (action) => {
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
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    color: 'var(--color-text-primary)',
                    backgroundColor: isDragOver ? 'var(--color-bg-tertiary)' : 'rgba(255, 255, 255, 0)',
                    border: isDragOver ? '1px dashed var(--color-accent)' : '1px solid transparent',
                    marginBottom: '2px'
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
                    style={{ padding: 0, background: 'transparent', border: 'none', marginRight: '0.25rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
                >
                    <div
                        style={{
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ChevronRight size={14} />
                    </div>
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
                <div
                    style={{ overflow: 'hidden' }}
                >
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

                    {filteredStories.map(storyId => (
                        <StoryItem
                            key={storyId}
                            storyId={storyId}
                            onSelectStory={onSelectStory}
                            selectedStoryId={selectedStoryId}
                            marginLeft="24px"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const FolderTree = ({ rootFolderId, onSelectStory, selectedStoryId, searchTerm }) => {
    const { folders, stories } = useStore();
    const rootFolder = folders[rootFolderId];

    if (!rootFolder) return null;

    // Filter stories based on search term (logic duplicated from FolderItem for root level)
    const filteredStories = rootFolder.stories.filter(storyId => {
        const story = stories[storyId];
        if (!story || story.deleted) return false;
        if (!searchTerm) return true;
        return story.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

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

            {filteredStories.map(storyId => (
                <StoryItem
                    key={storyId}
                    storyId={storyId}
                    onSelectStory={onSelectStory}
                    selectedStoryId={selectedStoryId}
                    marginLeft="12px"
                />
            ))}
        </div>
    );
};

export default FolderTree;
