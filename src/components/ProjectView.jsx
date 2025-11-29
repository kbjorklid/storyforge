import React from 'react';
import { useStore } from '../store';

const ProjectView = ({ projectId }) => {
    const { projects } = useStore();
    const project = projects.find(p => p.id === projectId);

    if (!project) return <div>Project not found</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>{project.name}</h2>
            <p>Select a story from the sidebar to edit, or create a new one.</p>
        </div>
    );
};

export default ProjectView;
