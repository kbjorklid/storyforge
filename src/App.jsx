import React, { useState } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import SettingsView from './components/SettingsView';
import ProjectView from './components/ProjectView';
import StoryView from './components/StoryView';
import { useStore } from './store';

function App() {
  const { currentProjectId, setCurrentProject } = useStore();
  const [selectedStoryId, setSelectedStoryId] = useState(null);

  const handleProjectSelect = (projectId) => {
    setCurrentProject(projectId);
    setSelectedStoryId(null);
  };

  const renderContent = () => {
    if (currentProjectId === 'settings') {
      return <SettingsView />;
    }

    if (selectedStoryId) {
      return <StoryView storyId={selectedStoryId} onBack={() => setSelectedStoryId(null)} />;
    }

    if (currentProjectId) {
      return <ProjectView projectId={currentProjectId} onSelectStory={setSelectedStoryId} />;
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
          onSelectStory={setSelectedStoryId}
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
