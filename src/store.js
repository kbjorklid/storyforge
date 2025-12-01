import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from './storage';
import { v4 as uuidv4 } from 'uuid';
import { generateVersionChangeDescription } from './services/ai';

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

const createStoryObject = (parentId, title, description, acceptanceCriteria, author = 'user') => {
    const newStoryId = uuidv4();
    const initialVersionId = uuidv4();
    const timestamp = new Date().toISOString();

    const initialVersion = {
        id: initialVersionId,
        parentId: null,
        timestamp,
        title,
        description,
        acceptanceCriteria,
        author
    };

    const newStory = {
        id: newStoryId,
        parentId,
        title,
        description,
        acceptanceCriteria,
        createdAt: timestamp,
        versions: { [initialVersionId]: initialVersion },
        currentVersionId: initialVersionId,
    };

    return { newStoryId, newStory };
};

const createContentSlice = (set) => ({
    folders: {}, // Record<string, Folder>
    stories: {}, // Record<string, Story>
    drafts: {}, // Record<string, { content: StoryContent, timestamp: string, baseVersionId: string }>

    triggerVersionTitleGeneration: (storyId, versionId, oldVersion, newVersion) => {
        const settings = get().settings;
        if (!settings.openRouterKey) return;

        generateVersionChangeDescription(oldVersion, newVersion, settings).then(result => {
            if (result) {
                get().updateVersion(storyId, versionId, {
                    changeTitle: result.changeTitle,
                    changeDescription: result.changeDescription
                });
            }
        });
    },

    saveDraft: (storyId, content, baseVersionId) => set((state) => ({
        drafts: {
            ...state.drafts,
            [storyId]: {
                content,
                timestamp: new Date().toISOString(),
                baseVersionId
            }
        }
    })),

    discardDraft: (storyId) => set((state) => {
        const newDrafts = { ...state.drafts };
        delete newDrafts[storyId];
        return { drafts: newDrafts };
    }),

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

    moveStory: (storyId, newParentId) => set((state) => {
        const story = state.stories[storyId];
        if (!story) return state;

        const oldParentId = story.parentId;
        if (oldParentId === newParentId) return state;

        const newState = {
            stories: {
                ...state.stories,
                [storyId]: { ...story, parentId: newParentId }
            },
            folders: { ...state.folders }
        };

        // Remove from old parent
        if (oldParentId && newState.folders[oldParentId]) {
            newState.folders[oldParentId] = {
                ...newState.folders[oldParentId],
                stories: newState.folders[oldParentId].stories.filter(id => id !== storyId)
            };
        }

        // Add to new parent
        if (newParentId && newState.folders[newParentId]) {
            newState.folders[newParentId] = {
                ...newState.folders[newParentId],
                stories: [...newState.folders[newParentId].stories, storyId]
            };
        }

        return newState;
    }),

    moveFolder: (folderId, newParentId) => set((state) => {
        const folder = state.folders[folderId];
        const newParent = state.folders[newParentId];

        if (!folder || !newParent) return state;
        if (folder.parentId === newParentId) return state;
        if (folderId === newParentId) return state;

        // Cycle detection: Check if newParentId is a descendant of folderId
        let current = newParent;
        while (current.parentId) {
            if (current.parentId === folderId) return state; // Cycle detected
            current = state.folders[current.parentId];
            if (!current) break; // Should not happen in valid tree
        }

        const newState = {
            folders: { ...state.folders }
        };

        // Remove from old parent
        if (folder.parentId && newState.folders[folder.parentId]) {
            newState.folders[folder.parentId] = {
                ...newState.folders[folder.parentId],
                children: newState.folders[folder.parentId].children.filter(id => id !== folderId)
            };
        }

        // Add to new parent
        newState.folders[newParentId] = {
            ...newState.folders[newParentId],
            children: [...newState.folders[newParentId].children, folderId]
        };

        // Update folder's parentId
        newState.folders[folderId] = {
            ...newState.folders[folderId],
            parentId: newParentId
        };

        return newState;
    }),

    deleteFolder: (folderId) => set((state) => {
        const folder = state.folders[folderId];
        if (!folder) return state;

        // Recursive deletion helper
        const getIdsToDelete = (fId, folders) => {
            let fIds = [fId];
            let sIds = [...(folders[fId]?.stories || [])];

            const children = folders[fId]?.children || [];
            children.forEach(childId => {
                const { fIds: childFIds, sIds: childSIds } = getIdsToDelete(childId, folders);
                fIds = [...fIds, ...childFIds];
                sIds = [...sIds, ...childSIds];
            });

            return { fIds, sIds };
        };

        const { fIds: foldersToDelete, sIds: storiesToDelete } = getIdsToDelete(folderId, state.folders);

        const newState = {
            folders: { ...state.folders },
            stories: { ...state.stories }
        };

        // Soft delete folders and their stories
        foldersToDelete.forEach(id => {
            if (newState.folders[id]) {
                newState.folders[id] = { ...newState.folders[id], deleted: true };
            }
        });
        storiesToDelete.forEach(id => {
            if (newState.stories[id]) {
                newState.stories[id] = { ...newState.stories[id], deleted: true };
            }
        });

        return newState;
    }),

    updateFolder: (folderId, updates) => set((state) => {
        if (!state.folders[folderId]) return state;
        return {
            folders: {
                ...state.folders,
                [folderId]: { ...state.folders[folderId], ...updates }
            }
        };
    }),

    unsavedStories: {}, // Record<string, boolean>

    setStoryUnsaved: (id, isUnsaved) => set((state) => {
        if (!!state.unsavedStories[id] === isUnsaved) return state;
        const newUnsaved = { ...state.unsavedStories };
        if (isUnsaved) {
            newUnsaved[id] = true;
        } else {
            delete newUnsaved[id];
        }
        return { unsavedStories: newUnsaved };
    }),

    addStory: (parentId, title, description, acceptanceCriteria) => {
        const { newStoryId, newStory } = createStoryObject(parentId, title, description, acceptanceCriteria);

        set((state) => {
            const newState = {
                stories: { ...state.stories, [newStoryId]: newStory },
                folders: { ...state.folders }
            };

            if (parentId && state.folders[parentId]) {
                newState.folders[parentId] = {
                    ...state.folders[parentId],
                    stories: [...state.folders[parentId].stories, newStoryId]
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

            // Check for identical content
            if (currentVersionId && versions[currentVersionId]) {
                const currentVersion = versions[currentVersionId];
                if (
                    currentVersion.title === content.title &&
                    currentVersion.description === content.description &&
                    currentVersion.acceptanceCriteria === content.acceptanceCriteria
                ) {
                    // Content is identical, do not create a new version
                    // But still clear unsaved/draft states as we are "saved"
                    const newUnsaved = { ...state.unsavedStories };
                    delete newUnsaved[id];
                    const newDrafts = { ...state.drafts };
                    delete newDrafts[id];

                    return {
                        unsavedStories: newUnsaved,
                        drafts: newDrafts
                    };
                }
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
                },
                unsavedStories: (() => {
                    const newUnsaved = { ...state.unsavedStories };
                    delete newUnsaved[id];
                    return newUnsaved;
                })(),
                drafts: (() => {
                    const newDrafts = { ...state.drafts };
                    delete newDrafts[id];
                    return newDrafts;
                })()
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
            },
            drafts: (() => {
                const newDrafts = { ...state.drafts };
                delete newDrafts[storyId];
                return newDrafts;
            })()
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

        return {
            stories: {
                ...state.stories,
                [id]: { ...story, deleted: true }
            },
            drafts: (() => {
                const newDrafts = { ...state.drafts };
                delete newDrafts[id];
                return newDrafts;
            })()
        };
    }),

    restoreStory: (id) => set((state) => {
        const story = state.stories[id];
        if (!story) return state;

        const newState = {
            stories: {
                ...state.stories,
                [id]: { ...story, deleted: false }
            },
            folders: { ...state.folders }
        };

        // Recursively restore parent folders
        let currentFolderId = story.parentId;
        while (currentFolderId && newState.folders[currentFolderId]) {
            const folder = newState.folders[currentFolderId];
            if (folder.deleted) {
                newState.folders[currentFolderId] = { ...folder, deleted: false };
            }
            currentFolderId = folder.parentId;
        }

        return newState;
    }),

    permanentlyDeleteStory: (id) => set((state) => {
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

    duplicateStory: (storyId) => set((state) => {
        const originalStory = state.stories[storyId];
        if (!originalStory) return state;

        const { newStoryId, newStory } = createStoryObject(
            originalStory.parentId,
            `${originalStory.title} (duplicate)`,
            originalStory.description,
            originalStory.acceptanceCriteria
        );

        const newState = {
            stories: { ...state.stories, [newStoryId]: newStory },
            folders: { ...state.folders }
        };

        if (originalStory.parentId && state.folders[originalStory.parentId]) {
            newState.folders[originalStory.parentId] = {
                ...state.folders[originalStory.parentId],
                stories: [...state.folders[originalStory.parentId].stories, newStoryId]
            };
        }

        return newState;
    }),
});

const createSettingsSlice = (set) => ({
    settings: {
        openRouterKey: '',
        anthropicKey: '',
        aiProvider: 'openrouter', // 'openrouter' or 'anthropic'
        providerSettings: {
            openrouter: {
                largeModel: 'openai/gpt-5-mini',
                smallModel: 'google/gemini-2.5-flash-lite',
            },
            anthropic: {
                largeModel: 'claude-3-5-sonnet-20240620',
                smallModel: 'claude-3-haiku-20240307',
            }
        }
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
