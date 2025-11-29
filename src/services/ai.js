export const improveStory = async (story, settings) => {
    const { openRouterKey, largeModel } = settings;

    if (!openRouterKey) {
        throw new Error('OpenRouter API Key is missing');
    }

    const prompt = `
    You are an expert Product Owner and Business Analyst.
    Please improve the following user story. 
    Make the title concise and action-oriented.
    Make the description clear, providing context and "who, what, why".
    Make the acceptance criteria specific, measurable, achievable, relevant, and time-bound (SMART).
    Return the result as a JSON object with keys: "title", "description", "acceptanceCriteria".
    The "description" and "acceptanceCriteria" fields MUST be strings (markdown is supported).
    Do NOT return arrays or objects for these fields.
    Do not include any markdown formatting around the JSON.

    Current Story:
    Title: ${story.title}
    Description: ${story.description}
    Acceptance Criteria: ${story.acceptanceCriteria}
  `;

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
                    { role: 'user', content: prompt }
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
