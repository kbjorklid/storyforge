const callOpenRouter = async (openRouterKey, model, messages, responseFormat = { type: 'json_object' }) => {
    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
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
                model,
                messages,
                response_format: responseFormat
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from OpenRouter');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('AI Service Error:', error);
        throw error;
    }
};

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

export const improveStory = async (story, settings, projectSettings = {}, qaContext = null, rewriteSelection = null) => {
    const { openRouterKey, largeModel, smallModel } = settings;
    const { context, systemPrompt } = projectSettings;

    // Determine which model to use based on selection
    // If only title is selected, use small model. Otherwise use large/reasoning model.
    let modelToUse = largeModel;
    if (rewriteSelection) {
        const { title, description, acceptanceCriteria } = rewriteSelection;
        if (title && !description && !acceptanceCriteria) {
            modelToUse = smallModel;
        }
    }

    let systemInstructions = `
    You are an expert Product Owner and Business Analyst.
    Please improve the following user story. 
    `;

    if (rewriteSelection) {
        const { title, description, acceptanceCriteria } = rewriteSelection;
        const parts = [];
        if (title) parts.push("title");
        if (description) parts.push("description");
        if (acceptanceCriteria) parts.push("acceptanceCriteria");

        systemInstructions += `
    You have been asked to rewrite ONLY the following parts: ${parts.join(", ")}.
    Do NOT modify any other parts of the story.
    Return the result as a JSON object with keys: ${parts.map(p => `"${p}"`).join(", ")}.
    `;
    } else {
        systemInstructions += `
    Make the title concise and action-oriented.
    Make the description clear, providing context and "who, what, why".
    Make the acceptance criteria specific, measurable, achievable, relevant, and time-bound (SMART).
    Return the result as a JSON object with keys: "title", "description", "acceptanceCriteria".
    `;
    }

    systemInstructions += `
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

    const content = await callOpenRouter(openRouterKey, modelToUse, [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userPrompt }
    ]);

    let parsed = JSON.parse(content);

    if (parsed.description) parsed.description = ensureString(parsed.description);
    if (parsed.acceptanceCriteria) parsed.acceptanceCriteria = ensureString(parsed.acceptanceCriteria);

    // Merge with original story to ensure we don't lose unselected parts
    // If rewriteSelection is provided, we only take the selected parts from the AI response
    // and keep the rest from the original story.
    let result = { ...story };

    if (rewriteSelection) {
        if (rewriteSelection.title && parsed.title) result.title = parsed.title;
        if (rewriteSelection.description && parsed.description) result.description = parsed.description;
        if (rewriteSelection.acceptanceCriteria && parsed.acceptanceCriteria) result.acceptanceCriteria = parsed.acceptanceCriteria;
    } else {
        // Fallback for when no selection is passed (legacy behavior), take everything
        result = { ...result, ...parsed };
    }

    return result;
};

export const generateClarifyingQuestions = async (story, settings, projectSettings = {}, type = 'improve') => {
    const { openRouterKey, largeModel } = settings;
    const { context, systemPrompt } = projectSettings;

    let systemInstructions = '';

    if (type === 'split') {
        systemInstructions = `
    You are an expert Product Owner and Business Analyst.
    Review the following user story. Your goal is to split this story into smaller, independent stories (INVEST criteria).
    Identify what information is missing or ambiguous that prevents you from effectively splitting this story.
    Generate 3-5 clarifying questions specifically about HOW to split the story (e.g., boundaries, distinct user flows, separate criteria, edge cases).
    Do NOT ask general questions about the story content unless it directly affects how it should be split.
    
    For each question, determine the best format:
    - "text": For open-ended questions.
    - "single_select": For questions with mutually exclusive options (radio buttons).
    - "multi_select": For questions where multiple options can be selected (checkboxes).
    
    If the provided options are not exhaustive, you may include an "Other" option as the last choice. This will allow the user to specify their own answer in a text field.
    
    Return the result as a JSON object where each key is a unique identifier (e.g., "question1", "question2") and the value is the question object.
    
    Example JSON structure:
    \`\`\`json
    {
        "question1": {
            "id": "q1",
            "text": "Should the admin and user flows be separate stories?",
            "type": "single_select",
            "options": ["Yes, separate them", "No, keep them together"]
        },
        "question2": {
            "id": "q2",
            "text": "What are the specific edge cases for the payment flow?",
            "type": "text"
        }
    }
    \`\`\`
    
    Do not include any markdown formatting around the JSON.
    `;
    } else {
        systemInstructions = `
    You are an expert Product Owner and Business Analyst.
    Review the following user story and identify ambiguities or missing details.
    Generate 3-5 clarifying questions that would help improve the story.
    
    For each question, determine the best format:
    - "text": For open-ended questions.
    - "single_select": For questions with mutually exclusive options (radio buttons).
    - "multi_select": For questions where multiple options can be selected (checkboxes).
    
    Return the result as a JSON object where each key is a unique identifier (e.g., "question1", "question2") and the value is the question object.
    
    Example JSON structure:
    \`\`\`json
    {
        "question1": {
            "id": "q1",
            "text": "What is the target response time for this API?",
            "type": "text"
        },
        "question2": {
            "id": "q2",
            "text": "Which user roles should have access?",
            "type": "multi_select",
            "options": ["Admin", "Editor", "Viewer"]
        }
    }
    \`\`\`
    
    Do not include any markdown formatting around the JSON.
    `;
    }

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

    const content = await callOpenRouter(openRouterKey, largeModel, [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userPrompt }
    ]);

    // Handle case where AI might wrap the array in an object key like "questions"
    let parsed = JSON.parse(content);
    if (!Array.isArray(parsed) && parsed.questions && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
    } else if (!Array.isArray(parsed)) {
        // Fallback: Check if it's an object with numeric keys or just values
        const values = Object.values(parsed);
        if (values.length > 0 && typeof values[0] === 'object') {
            // This is the expected format now (object with keys)
            parsed = values;
        } else {
            console.warn("AI did not return an array, attempting to extract", parsed);
            return [];
        }
    }

    return parsed;
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
        const content = await callOpenRouter(openRouterKey, smallModel, [
            { role: 'user', content: prompt }
        ]);
        return JSON.parse(content);
    } catch (error) {
        console.error('AI Service Error (Version Description):', error);
        return null;
    }
};


export const splitStory = async (story, settings, projectSettings = {}, userInstructions = '', qaContext = null) => {
    const { openRouterKey, largeModel } = settings;
    const { context, systemPrompt } = projectSettings;

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

    if (qaContext) {
        userPrompt += `\n\nClarifying Questions and Answers:\n`;
        qaContext.forEach((qa, index) => {
            userPrompt += `Q${index + 1}: ${qa.question}\nA: ${qa.answer}\n`;
        });
        userPrompt += `\nPlease incorporate the information from these answers when splitting the story.`;
    }

    if (userInstructions) {
        userPrompt += `\n\nUser Instructions for Splitting:\n${userInstructions}`;
    }

    if (context) {
        userPrompt = `Project Context:\n${context}\n\n` + userPrompt;
    }

    const content = await callOpenRouter(openRouterKey, largeModel, [
        { role: 'system', content: systemInstructions },
        { role: 'user', content: userPrompt }
    ]);

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

    return parsed.map(s => ({
        title: s.title,
        description: ensureString(s.description),
        acceptanceCriteria: ensureString(s.acceptanceCriteria)
    }));
};

export const generateSubfolderName = async (story, settings) => {
    const { openRouterKey, smallModel } = settings;

    if (!openRouterKey) {
        return null;
    }

    const prompt = `
    You are a helpful assistant.
    Based on the following user story, suggest a short, concise name for a subfolder to contain stories split from this one.
    The name should be 1-3 words max, e.g. "User Management", "Payment Flow", "Admin Dashboard".
    
    Story Title: ${story.title}
    Story Description: ${story.description}

    Return ONLY the name. Do not include quotes or any other text.
    `;

    try {
        const content = await callOpenRouter(openRouterKey, smallModel, [
            { role: 'user', content: prompt }
        ], { type: 'text' });
        return content.trim().replace(/['"]/g, '');
    } catch (error) {
        console.error('AI Service Error (Subfolder Name):', error);
        return null;
    }
};

const callOpenRouterStreaming = async (openRouterKey, model, messages, onChunk) => {
    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
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
                model,
                messages,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to fetch from OpenRouter');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            onChunk(content);
                        }
                    } catch (e) {
                        console.error('Error parsing stream data:', e);
                    }
                }
            }
        }
    } catch (error) {
        console.error('AI Service Error (Streaming):', error);
        throw error;
    }
};

export const chatWithStories = async (stories, messages, settings, projectSettings = {}, onChunk = null) => {
    const { openRouterKey, largeModel } = settings;
    const { context, systemPrompt } = projectSettings;

    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
    }

    let systemInstructions = `
    You are a helpful assistant and expert Product Owner/Business Analyst.
    You are chatting with a user about a specific set of user stories.
    
    Here are the stories you have context for:
    ${stories.map(s => `
    ---
    Title: ${s.title}
    Description: ${s.description}
    Acceptance Criteria: ${s.acceptanceCriteria}
    ---
    `).join('\n')}

    Answer the user's questions based on these stories.
    If the user asks for suggestions, provide them based on Agile best practices and the content of the stories.
    If the user asks about something not related to these stories, you can answer generally but try to tie it back to the project context if possible.
    
    IMPORTANT: When presenting multiple points or sections, prefer using second-level headers (##) for the top-level items instead of a numbered list.
    
    Discouraged:
    1. First point
       - Some explanation
    
    Encouraged:
    ## 1. First point
       - Some explanation

    When using lists, ensure proper markdown nesting. If you have bullet points under a header or list item, indent them by 4 spaces so they are rendered as nested lists.
    `;

    if (systemPrompt) {
        systemInstructions += `\n\nAdditional Project Instructions:\n${systemPrompt}`;
    }

    if (context) {
        systemInstructions += `\n\nProject Context:\n${context}`;
    }

    // Filter out the local-only system message we added in the UI
    const apiMessages = messages.filter(m => m.role !== 'system');

    try {
        if (onChunk) {
            await callOpenRouterStreaming(openRouterKey, largeModel, [
                { role: 'system', content: systemInstructions },
                ...apiMessages
            ], onChunk);
            return;
        }

        const content = await callOpenRouter(openRouterKey, largeModel, [
            { role: 'system', content: systemInstructions },
            ...apiMessages
        ], { type: 'text' }); // We expect text response, not JSON

        return content;
    } catch (error) {
        console.error('AI Service Error (Chat):', error);
        throw error;
    }
};
