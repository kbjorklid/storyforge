import React, { useState } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import ProjectView from './components/ProjectView';
import StoryView from './components/StoryView';
import { useStore } from './store';

function App() {
  const { currentProjectId, setCurrentProject, stories, folders, projects } = useStore();
  const [selectedStoryId, setSelectedStoryId] = useState(null);

  const handleProjectSelect = (projectId) => {
    setCurrentProject(projectId);
    setSelectedStoryId(null);
  };

  const handleStorySelect = (storyId) => {
    setSelectedStoryId(storyId);

    // Also switch to the project containing this story
    if (storyId && stories[storyId]) {
      const story = stories[storyId];
      const parentFolder = folders[story.parentId];
      if (parentFolder) {
        // If parent is a root folder, it has projectId directly. 
        // If it's a subfolder, we need to traverse up or check if subfolders have projectId (they do in this codebase)
        if (parentFolder.projectId) {
          setCurrentProject(parentFolder.projectId);
        }
      }
    }
  };

  const renderContent = () => {
    if (selectedStoryId) {
      return <StoryView storyId={selectedStoryId} onBack={() => setSelectedStoryId(null)} />;
    }

    if (currentProjectId === 'settings') {
      return <SettingsView />;
    }

    if (currentProjectId) {
      return <ProjectView projectId={currentProjectId} onSelectStory={handleStorySelect} />;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
        <h2 style={{ marginBottom: '1rem' }}>Welcome to StoryForge</h2>
        <p>Select a project from the sidebar or create a new one to get started.</p>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ display: 'flex', height: '100%', width: '100%' }}>
        <Sidebar
          onSelectStory={handleStorySelect}
          selectedStoryId={selectedStoryId}
          onSelectProject={handleProjectSelect}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--color-bg-primary)' }}>
          {renderContent()}
        </main>
      </div>
    </Layout>
  );
}

export default App;
