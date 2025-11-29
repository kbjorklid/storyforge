import React, { useState } from 'react';
import { useStore } from '../store';
import { Settings, Plus, Folder, Trash2 } from 'lucide-react';
import FolderTree from './FolderTree';

const Sidebar = ({ onSelectStory }) => {
    const { projects, currentProjectId, addProject, setCurrentProject, deleteProject } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleCreateProject = (e) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            addProject(newProjectName, '');
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    return (
        <aside style={{
            width: '300px',
            backgroundColor: 'var(--color-bg-secondary)',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            height: '100vh'
        }}>
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

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {projects.map((project) => (
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
                                onClick={() => setCurrentProject(project.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                    <Folder size={16} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{project.name}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this project?')) deleteProject(project.id);
                                    }}
                                    style={{ padding: '0.25rem', backgroundColor: 'transparent', color: 'var(--color-text-secondary)' }}
                                    className="delete-btn"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {currentProjectId === project.id && (
                                <div style={{ marginLeft: '0.5rem', borderLeft: '1px solid var(--color-border)', paddingLeft: '0.5rem' }}>
                                    <FolderTree rootFolderId={project.rootFolderId} onSelectStory={onSelectStory} />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <button
                    onClick={() => setCurrentProject('settings')}
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
