export const improveStory = async (story, settings, projectSettings = {}) => {
    const { openRouterKey, largeModel } = settings;
    const { context, systemPrompt } = projectSettings;

    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
    }

    let systemInstructions = `
    You are an expert Product Owner and Business Analyst.
    Please improve the following user story. 
    Make the title concise and action-oriented.
    Make the description clear, providing context and "who, what, why".
    Make the acceptance criteria specific, measurable, achievable, relevant, and time-bound (SMART).
    Return the result as a JSON object with keys: "title", "description", "acceptanceCriteria".
    The "description" and "acceptanceCriteria" fields MUST be strings (markdown is supported).
    Do NOT return arrays or objects for these fields.
    Do not include any markdown formatting around the JSON.
    `;

    if (systemPrompt) {
        systemInstructions += `\n\nAdditional Instructions:\n${systemPrompt}`;
    }

    let userPrompt = `Current Story:
    Title: ${story.title}
    Description: ${story.description}
    Acceptance Criteria: ${story.acceptanceCriteria}`;

    if (context) {
        userPrompt = `Project Context:\n${context}\n\n` + userPrompt;
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173', // Optional, for including your app on openrouter.ai rankings.
                'X-Title': 'StoryForge', // Optional. Shows in rankings on openrouter.ai.
            },
            body: JSON.stringify({
                model: largeModel,
                messages: [
                    { role: 'system', content: systemInstructions },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from OpenRouter');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        let parsed = JSON.parse(content);

        // Helper to ensure string content
        const ensureString = (content) => {
            if (typeof content === 'string') return content;
            if (Array.isArray(content)) return content.join('\n\n');
            if (typeof content === 'object' && content !== null) {
                return Object.entries(content)
                    .map(([key, value]) => `**${key}:** ${value}`)
                    .join('\n\n');
            }
            return String(content || '');
        };

        parsed.description = ensureString(parsed.description);
        parsed.acceptanceCriteria = ensureString(parsed.acceptanceCriteria);

        return parsed;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

export const generateVersionChangeDescription = async (oldVersion, newVersion, settings) => {
    const { openRouterKey, smallModel } = settings;

    if (!openRouterKey) {
        console.warn('OpenRouter API Key is missing, skipping version description generation');
        return null;
    }

    const prompt = `
    You are a helpful assistant.
    Compare the following two versions of a user story and describe the changes.
    
    Old Version:
    Title: ${oldVersion.title}
    Description: ${oldVersion.description}
    Acceptance Criteria: ${oldVersion.acceptanceCriteria}

    New Version:
    Title: ${newVersion.title}
    Description: ${newVersion.description}
    Acceptance Criteria: ${newVersion.acceptanceCriteria}

    Provide a JSON object with two fields:
    1. "changeTitle": A very short summary of the change (max 5 words).
    2. "changeDescription": A concise description of what changed (max 2 sentences).
    Do not include any markdown formatting around the JSON.
    `;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'StoryForge',
            },
            body: JSON.stringify({
                model: smallModel,
                messages: [
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to fetch from OpenRouter for version description:', errorData);
            return null;
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        return JSON.parse(content);

    } catch (error) {
        console.error('AI Service Error (Version Description):', error);
        return null;
    }
};
