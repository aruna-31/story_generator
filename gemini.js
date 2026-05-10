// Gemini AI integration
// WARNING: Embedding API keys in client code is insecure for production.
// Consider using a server-side proxy to protect your API key.

/*
Example Node/Express proxy for production:

const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

const GEMINI_KEY = process.env.GEMINI_KEY; // Keep secret in environment variable

app.post('/proxy/gemini', async (req, res) => {
    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        const text = await resp.text();
        res.status(resp.status).send(text);
    } catch (e) { 
        res.status(500).send({ error: e.message }); 
    }
});

app.listen(3000);
*/

const GEMINI_KEY = "AIzaSyD67CJxrR5yu4UEWXsfH0D4Yf70I2Lpi88";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

export async function callGemini(prompt, options = {}) {
    const {
        temperature = 0.8,
        maxOutputTokens = 400,
        candidateCount = 1
    } = options;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature,
            maxOutputTokens,
            candidateCount
        }
    };

    try {
        console.log('Calling Gemini API with prompt:', prompt.substring(0, 100) + '...');
        
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            console.error('Gemini API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`Gemini API error (${response.status}): ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini API Response:', data);

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No candidates returned from Gemini API');
        }

        // Return array of candidates or single candidate text
        if (candidateCount > 1) {
            return data.candidates.map(candidate => 
                candidate.content?.parts?.[0]?.text || 'No content generated'
            );
        } else {
            return data.candidates[0]?.content?.parts?.[0]?.text || 'No content generated';
        }

    } catch (error) {
        console.error('Gemini call failed:', error);
        
        // Check if it's a CORS error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('CORS blocked - Direct API calls may be restricted. Consider using a proxy server. See console for proxy example.');
        }
        
        throw error;
    }
}

// Story generation with multiple candidates
export async function generateStoryCandidates(genre, characters, prompt, existingStory = '') {
    const characterList = characters.length > 0 ? characters.join(', ') : 'various characters';
    
    const fullPrompt = `Generate 3 different story continuations for a ${genre} story.

Characters: ${characterList}
Story prompt: ${prompt}
${existingStory ? `Previous story context: ${existingStory.substring(-500)}` : ''}

Requirements:
- Each continuation should be 150-200 words
- Maintain the ${genre} genre throughout
- Include the specified characters naturally
- Create engaging, creative content
- Each version should take a different direction

Please provide exactly 3 distinct story continuations.`;

    return await callGemini(fullPrompt, { candidateCount: 3, maxOutputTokens: 800 });
}

// Game concept generation
export async function generateGameConcept(gameType, platform, mechanics, characters) {
    const characterList = characters.length > 0 ? characters.join(', ') : 'player character';
    
    const prompt = `Create a detailed game design concept for a ${gameType} game.

Platform: ${platform}
Core Mechanics: ${mechanics}
Main Characters: ${characterList}

Please provide:
1. Game Overview (2-3 sentences)
2. Core Gameplay Mechanics
3. Character Roles and Abilities
4. Level/World Design
5. Unique Features
6. Target Audience
7. Monetization Strategy (if applicable)

Make it creative, engaging, and feasible for the specified platform.`;

    return await callGemini(prompt, { maxOutputTokens: 600 });
}

// Educational chat response
export async function getEducationalResponse(question, level = 'school') {
    const levelContext = {
        school: 'You are an AI tutor for school students (grades 1-12). Explain concepts clearly with examples appropriate for young learners.',
        intermediate: 'You are an AI tutor for competitive exam preparation (JEE, NEET, etc.). Provide detailed explanations with problem-solving approaches.',
        college: 'You are an AI tutor for college-level students. Provide in-depth technical explanations and professional insights.'
    };

    const prompt = `${levelContext[level]}

Student Question: ${question}

Please provide a helpful, educational response that:
- Explains the concept clearly
- Includes relevant examples
- Offers practical tips or study strategies
- Encourages further learning

Keep the response engaging and supportive.`;

    return await callGemini(prompt, { maxOutputTokens: 500 });
}

// Export for global access
window.gemini = {
    callGemini,
    generateStoryCandidates,
    generateGameConcept,
    getEducationalResponse
};