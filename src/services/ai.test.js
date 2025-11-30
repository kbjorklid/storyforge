import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chatWithStories } from './ai';

describe('chatWithStories', () => {
    const mockSettings = {
        openRouterKey: 'test-key',
        largeModel: 'test-model'
    };

    const mockStories = [
        {
            title: 'Story 1',
            description: 'Description 1',
            acceptanceCriteria: 'AC 1'
        }
    ];

    const mockMessages = [
        { role: 'user', content: 'Hello' }
    ];

    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should include project context in the system prompt', async () => {
        const projectSettings = {
            context: 'This is the project context.',
            systemPrompt: 'This is the system prompt.'
        };

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'AI response' } }]
            })
        });

        await chatWithStories(mockStories, mockMessages, mockSettings, projectSettings);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        const systemMessage = body.messages.find(m => m.role === 'system');
        expect(systemMessage).toBeDefined();
        expect(systemMessage.content).toContain('Project Context:');
        expect(systemMessage.content).toContain('This is the project context.');
        expect(systemMessage.content).toContain('Additional Project Instructions:');
        expect(systemMessage.content).toContain('This is the system prompt.');
    });

    it('should not include project context if not provided', async () => {
        const projectSettings = {};

        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'AI response' } }]
            })
        });

        await chatWithStories(mockStories, mockMessages, mockSettings, projectSettings);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const callArgs = global.fetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        const systemMessage = body.messages.find(m => m.role === 'system');
        expect(systemMessage).toBeDefined();
        expect(systemMessage.content).not.toContain('Project Context:');
        expect(systemMessage.content).not.toContain('Additional Project Instructions:');
    });
});
