import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';

const createProjectSlice = (set, get) => ({
    projects: [],
    currentProjectId: null,

    addProject: (name, description) => set((state) => {
        const newProject = {
            id: uuidv4(),
            name,
            description,
            createdAt: new Date().toISOString(),
            rootFolderId: uuidv4(), // Each project has a root folder
            context: '',
            systemPrompt: '',
        };
        // Also create the root folder in content slice
        get().addFolder(newProject.rootFolderId, null, 'Root', newProject.id);

        return {
            projects: [...state.projects, newProject],
            currentProjectId: newProject.id,
        };
    }),

    setCurrentProject: (id) => set({ currentProjectId: id }),

    updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

    deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    })),
});

const createContentSlice = (set, get) => ({
    folders: {}, // Record<string, Folder>
    stories: {}, // Record<string, Story>

    addFolder: (id, parentId, name, projectId) => set((state) => {
        const newFolder = {
            id: id || uuidv4(),
            parentId,
            name,
            projectId,
            children: [], // list of folder IDs
            stories: [], // list of story IDs
        };

        const newState = {
            folders: { ...state.folders, [newFolder.id]: newFolder },
        };

        if (parentId && state.folders[parentId]) {
            newState.folders[parentId] = {
                ...state.folders[parentId],
                children: [...state.folders[parentId].children, newFolder.id]
            }
        }

        return newState;
    }),

    addStory: (parentId, title, description, acceptanceCriteria) => {
        const newStoryId = uuidv4();
        const initialVersionId = uuidv4();

        set((state) => {
            const initialVersion = {
                id: initialVersionId,
                parentId: null,
                timestamp: new Date().toISOString(),
                title,
                description,
                acceptanceCriteria,
                author: 'user'
            };

            const newStory = {
                id: newStoryId,
                parentId,
                title,
                description,
                acceptanceCriteria,
                createdAt: new Date().toISOString(),
                versions: { [initialVersionId]: initialVersion },
                currentVersionId: initialVersionId,
            };

            const newState = {
                stories: { ...state.stories, [newStory.id]: newStory },
                folders: { ...state.folders }
            };

            if (parentId && state.folders[parentId]) {
                newState.folders[parentId] = {
                    ...state.folders[parentId],
                    stories: [...state.folders[parentId].stories, newStory.id]
                }
            }

            return newState;
        });
        return newStoryId;
    },

    saveStory: (id, content, author = 'user') => {
        let newVersionId;
        set((state) => {
            const story = state.stories[id];
            if (!story) return state;

            // Handle legacy stories without versions
            let versions = story.versions || {};
            let currentVersionId = story.currentVersionId;

            if (!currentVersionId && Object.keys(versions).length === 0) {
                // Create a root version from the current state if none exists
                const rootVersionId = uuidv4();
                const rootVersion = {
                    id: rootVersionId,
                    parentId: null,
                    timestamp: story.createdAt || new Date().toISOString(),
                    title: story.title,
                    description: story.description,
                    acceptanceCriteria: story.acceptanceCriteria,
                    author: 'user' // Assume user for legacy
                };
                versions = { [rootVersionId]: rootVersion };
                currentVersionId = rootVersionId;
            }

            newVersionId = uuidv4();
            const newVersion = {
                id: newVersionId,
                parentId: currentVersionId,
                timestamp: new Date().toISOString(),
                title: content.title,
                description: content.description,
                acceptanceCriteria: content.acceptanceCriteria,
                author
            };

            return {
                stories: {
                    ...state.stories,
                    [id]: {
                        ...story,
                        ...content,
                        versions: { ...versions, [newVersionId]: newVersion },
                        currentVersionId: newVersionId
                    }
                }
            };
        });
        return newVersionId;
    },

    restoreVersion: (storyId, versionId) => set((state) => {
        const story = state.stories[storyId];
        if (!story || !story.versions || !story.versions[versionId]) return state;

        const version = story.versions[versionId];

        return {
            stories: {
                ...state.stories,
                [storyId]: {
                    ...story,
                    title: version.title,
                    description: version.description,
                    acceptanceCriteria: version.acceptanceCriteria,
                    currentVersionId: versionId
                }
            }
        };
    }),

    updateVersion: (storyId, versionId, updates) => set((state) => {
        const story = state.stories[storyId];
        if (!story || !story.versions || !story.versions[versionId]) return state;

        return {
            stories: {
                ...state.stories,
                [storyId]: {
                    ...story,
                    versions: {
                        ...story.versions,
                        [versionId]: {
                            ...story.versions[versionId],
                            ...updates
                        }
                    }
                }
            }
        };
    }),

    updateStory: (id, updates) => set((state) => ({
        stories: {
            ...state.stories,
            [id]: { ...state.stories[id], ...updates },
        },
    })),

    deleteStory: (id) => set((state) => {
        const story = state.stories[id];
        if (!story) return state;

        const parentFolder = state.folders[story.parentId];
        const newState = {
            stories: { ...state.stories },
            folders: { ...state.folders }
        };
        delete newState.stories[id];

        if (parentFolder) {
            newState.folders[story.parentId] = {
                ...parentFolder,
                stories: parentFolder.stories.filter(sid => sid !== id)
            };
        }
        return newState;
    }),
});

const createSettingsSlice = (set) => ({
    settings: {
        openRouterKey: '',
        largeModel: 'openai/gpt-5-mini',
        smallModel: 'google/gemini-2.5-flash-lite',
    },
    updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
    })),
});

export const useStore = create(
    persist(
        (...a) => ({
            ...createProjectSlice(...a),
            ...createContentSlice(...a),
            ...createSettingsSlice(...a),
        }),
        {
            name: 'storyforge-storage',
            storage: createJSONStorage(() => storage),
        }
    )
);
