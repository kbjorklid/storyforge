export const improveStory = async (story, settings, projectSettings = {}, qaContext = null) => {
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

    if (qaContext) {
        userPrompt += `\n\nClarifying Questions and Answers:\n`;
        qaContext.forEach((qa, index) => {
            userPrompt += `Q${index + 1}: ${qa.question}\nA: ${qa.answer}\n`;
        });
        userPrompt += `\nPlease incorporate the information from these answers into the improved story.`;
    }

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

export const generateClarifyingQuestions = async (story, settings, projectSettings = {}) => {
    const { openRouterKey, largeModel } = settings;
    const { context, systemPrompt } = projectSettings;

    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
    }

    let systemInstructions = `
    You are an expert Product Owner and Business Analyst.
    Review the following user story and identify ambiguities or missing details.
    Generate 3-5 clarifying questions that would help improve the story.
    
    For each question, determine the best format:
    - "text": For open-ended questions.
    - "single_select": For questions with mutually exclusive options (radio buttons).
    - "multi_select": For questions where multiple options can be selected (checkboxes).
    
    Return the result as a JSON array of objects with the following structure:
    {
        "id": "unique_id",
        "text": "The question text",
        "type": "text" | "single_select" | "multi_select",
        "options": ["Option 1", "Option 2"] // Only for select types
    }
    
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
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'StoryForge',
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

        // Handle case where AI might wrap the array in an object key like "questions"
        let parsed = JSON.parse(content);
        if (!Array.isArray(parsed) && parsed.questions && Array.isArray(parsed.questions)) {
            parsed = parsed.questions;
        } else if (!Array.isArray(parsed)) {
            // Fallback: Check if it's an object with numeric keys or just values
            const values = Object.values(parsed);
            if (values.length > 0 && typeof values[0] === 'object') {
                console.warn("AI returned an object instead of array, using values:", parsed);
                parsed = values;
            } else {
                console.warn("AI did not return an array, attempting to extract", parsed);
                return [];
            }
        }

        return parsed;

    } catch (error) {
        console.error('AI Service Error (Clarifying Questions):', error);
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


export const splitStory = async (story, settings, projectSettings = {}, userInstructions = '') => {
    const { openRouterKey, largeModel } = settings;
    const { context, systemPrompt } = projectSettings;

    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
    }

    let systemInstructions = `
    You are an expert Product Owner and Business Analyst.
    Your task is to split a large user story into multiple smaller, independent, and valuable user stories (INVEST criteria).
    
    Return the result as a JSON array of objects, where each object represents a new story and has the following keys:
    - "title": The title of the new story.
    - "description": The description of the new story.
    - "acceptanceCriteria": The acceptance criteria for the new story.
    
    The "description" and "acceptanceCriteria" fields MUST be strings (markdown is supported).
    Do NOT return arrays or objects for these fields.
    Do not include any markdown formatting around the JSON.
    `;

    if (systemPrompt) {
        systemInstructions += `\n\nAdditional Instructions:\n${systemPrompt}`;
    }

    let userPrompt = `Please split the following story into smaller stories:
    
    Current Story:
    Title: ${story.title}
    Description: ${story.description}
    Acceptance Criteria: ${story.acceptanceCriteria}`;

    if (userInstructions) {
        userPrompt += `\n\nUser Instructions for Splitting:\n${userInstructions}`;
    }

    if (context) {
        userPrompt = `Project Context:\n${context}\n\n` + userPrompt;
    }

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
                model: largeModel, // Use the large model for reasoning as requested
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

        // Handle potential wrapping
        if (!Array.isArray(parsed) && parsed.stories && Array.isArray(parsed.stories)) {
            parsed = parsed.stories;
        } else if (!Array.isArray(parsed)) {
            // Try to find an array in the object values
            const values = Object.values(parsed);
            const arrayValue = values.find(v => Array.isArray(v));
            if (arrayValue) {
                parsed = arrayValue;
            } else {
                // Check if the values themselves are the stories (e.g. {0: story, 1: story})
                // We can check if the first value has a 'title' property
                if (values.length > 0 && values[0] && typeof values[0] === 'object' && 'title' in values[0]) {
                    parsed = values;
                } else {
                    return [];
                }
            }
        }

        // Ensure string content for each story
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

        return parsed.map(s => ({
            title: s.title,
            description: ensureString(s.description),
            acceptanceCriteria: ensureString(s.acceptanceCriteria)
        }));

    } catch (error) {
        console.error('AI Service Error (Split Story):', error);
        throw error;
    }
};
