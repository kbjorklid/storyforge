import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, Plus, Folder, Trash2, ChevronDown, ChevronRight, MoreVertical, FileText, Edit2 } from 'lucide-react';
import FolderTree from './FolderTree';
import Menu from './Menu';

const Sidebar = ({ onSelectStory, selectedStoryId, onSelectProject }) => {
    const { projects, currentProjectId, addProject, deleteProject, addFolder, addStory, moveStory, moveFolder, updateProject } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [expandedProjectIds, setExpandedProjectIds] = useState(new Set());
    const [width, setWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState(null); // { id: string, type: 'project', position: { x, y } }
    const sidebarRef = React.useRef(null);

    // Expand current project when selected
    React.useEffect(() => {
        if (currentProjectId) {
            setExpandedProjectIds(prev => {
                const next = new Set(prev);
                next.add(currentProjectId);
                return next;
            });
        }
    }, [currentProjectId]);

    const startResizing = React.useCallback((mouseDownEvent) => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback((mouseMoveEvent) => {
        if (isResizing) {
            const newWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
            if (newWidth >= 200 && newWidth <= 600) {
                setWidth(newWidth);
            }
        }
    }, [isResizing]);

    React.useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const handleCreateProject = (e) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            addProject(newProjectName, '');
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    const toggleProject = (projectId) => {
        setExpandedProjectIds(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    const handleDropOnProject = (e, projectId, rootFolderId) => {
        e.preventDefault();
        const storyId = e.dataTransfer.getData('storyId');
        const folderId = e.dataTransfer.getData('folderId');

        if (storyId) {
            moveStory(storyId, rootFolderId);
            setExpandedProjectIds(prev => new Set(prev).add(projectId));
        } else if (folderId) {
            moveFolder(folderId, rootFolderId);
            setExpandedProjectIds(prev => new Set(prev).add(projectId));
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
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

    const handleMenuAction = (action, project) => {
        switch (action) {
            case 'new-folder': {
                const name = prompt('Folder Name:');
                if (name) addFolder(null, project.rootFolderId, name, project.id);
                setExpandedProjectIds(prev => new Set(prev).add(project.id));
                break;
            }
            case 'new-story': {
                const name = prompt('Story Name:');
                if (name) {
                    const newStoryId = addStory(project.rootFolderId, name, '', '');
                    if (newStoryId) onSelectStory(newStoryId);
                }
                setExpandedProjectIds(prev => new Set(prev).add(project.id));
                break;
            }
            case 'rename': {
                const name = prompt('New Project Name:', project.name);
                if (name && name.trim()) {
                    updateProject(project.id, { name: name.trim() });
                }
                break;
            }
            case 'delete': {
                if (confirm('Are you sure you want to delete this project?')) {
                    deleteProject(project.id);
                }
                break;
            }
        }
    };

    return (
        <aside
            ref={sidebarRef}
            style={{
                width: `${width}px`,
                backgroundColor: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem',
                height: '100vh',
                position: 'relative',
                flexShrink: 0
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '5px',
                    height: '100%',
                    cursor: 'col-resize',
                    backgroundColor: isResizing ? 'var(--color-primary)' : 'transparent',
                    zIndex: 10,
                    transition: 'background-color 0.2s'
                }}
                onMouseDown={startResizing}
                className="sidebar-resizer"
            />
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>StoryForge</h1>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h2 style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects</h2>
                    <button
                        onClick={() => setIsCreating(true)}
                        style={{ padding: '0.25rem', backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
                        title="New Project"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreateProject} style={{ marginBottom: '1rem' }}>
                        <input
                            autoFocus
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project Name"
                            style={{ width: '100%', marginBottom: '0.5rem', padding: '0.25rem' }}
                            onBlur={() => setIsCreating(false)}
                        />
                    </form>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search stories..."
                        style={{
                            width: '100%',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.9rem',
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'var(--color-text-primary)'
                        }}
                    />
                </div>

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {projects.map((project) => {
                        const isExpanded = expandedProjectIds.has(project.id);
                        return (
                            <li key={project.id} style={{ marginBottom: '0.5rem' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        backgroundColor: currentProjectId === project.id ? 'var(--color-bg-tertiary)' : 'transparent',
                                        color: currentProjectId === project.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
                                    }}
                                    onClick={() => {
                                        onSelectProject(project.id);
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropOnProject(e, project.id, project.rootFolderId)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', flex: 1 }}>
                                        <button
                                            style={{
                                                padding: 0,
                                                background: 'transparent',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'inherit',
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleProject(project.id);
                                            }}
                                        >
                                            {isExpanded ? (
                                                <ChevronDown size={14} />
                                            ) : (
                                                <ChevronRight size={14} />
                                            )}
                                        </button>
                                        <Folder size={16} />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{project.name}</span>
                                    </div>
                                    <button
                                        onClick={(e) => handleMenuOpen(e, project.id, 'project')}
                                        style={{
                                            padding: '0.25rem',
                                            backgroundColor: 'transparent',
                                            color: 'var(--color-text-secondary)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <MoreVertical size={14} />
                                    </button>

                                    {activeMenu?.id === project.id && activeMenu?.type === 'project' && (
                                        <Menu
                                            isOpen={true}
                                            onClose={() => setActiveMenu(null)}
                                            position={activeMenu.position}
                                            items={[
                                                { label: 'New Folder', icon: <Folder size={14} />, onClick: () => handleMenuAction('new-folder', project) },
                                                { label: 'New Story', icon: <FileText size={14} />, onClick: () => handleMenuAction('new-story', project) },
                                                { label: 'Rename Project', icon: <Edit2 size={14} />, onClick: () => handleMenuAction('rename', project) },
                                                { label: 'Delete Project', icon: <Trash2 size={14} />, onClick: () => handleMenuAction('delete', project), danger: true },
                                            ]}
                                        />
                                    )}
                                </div>

                                {isExpanded && (
                                    <div style={{ marginLeft: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.5rem' }}>
                                        <FolderTree
                                            rootFolderId={project.rootFolderId}
                                            onSelectStory={onSelectStory}
                                            selectedStoryId={selectedStoryId}
                                            searchTerm={searchTerm}
                                        />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button
                    onClick={() => onSelectProject('settings')}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: currentProjectId === 'settings' ? 'var(--color-bg-tertiary)' : 'transparent',
                        justifyContent: 'flex-start',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        color: 'var(--color-text-secondary)'
                    }}
                >
                    <Settings size={16} />
                    Settings
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
