const axios = require('axios');
console.log('🔵 AI Service Initialized');


async function processWithAI(userMessage) {

    console.log('🔵 Processing message with AI:', userMessage);
    console.log("api key:", process.env.OPENAI_API_KEY ? 'Available' : 'Not Set');


    try {
        const systemPrompt = {
            role: 'system',
            content: 'You are a helpful assistant for a CRM dashboard.'
        };

        const userPrompt = {
            role: 'user',
            content: userMessage
        };

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [systemPrompt, userPrompt],
                max_tokens: 300,
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        const aiReply = response.data.choices?.[0]?.message?.content || 'Sorry, I couldn’t generate a response.';
        console.log('✅ AI replied with:', aiReply);
        return aiReply.trim();

    } catch (error) {
        console.error('🔴 AI processing failed:', error.message);
        return 'Sorry, something went wrong while generating a response.';
    }
}

module.exports = { processWithAI };
