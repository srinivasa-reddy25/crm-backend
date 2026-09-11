const axios = require('axios');
const { getCrmContextForAi } = require('./aiContext');

function aiFailure(error) {
    const status = error.response?.status;
    const upstream = error.response?.data?.error || {};
    const quota = status === 429 && (upstream.code === 'insufficient_quota' || /credits|quota|billing/i.test(upstream.message || ''));
    const result = new Error(quota
        ? 'AI replies are unavailable because the configured OpenAI account has no API credits. Add credits or configure a funded API key, then retry.'
        : status === 401 || status === 403
            ? 'The AI service credentials are not valid. Update the backend OpenAI API key, then retry.'
            : error.code === 'ECONNABORTED'
                ? 'The AI service took too long to respond. Please retry.'
                : status === 429
                    ? 'The AI service is busy. Please wait a moment and retry.'
                    : 'The AI service could not complete your message. Please retry.');
    result.code = quota ? 'AI_QUOTA_EXHAUSTED' : 'AI_UNAVAILABLE';
    return result;
}

async function processWithAI(userMessage, userId, conversationId) {
    if (!process.env.OPENAI_API_KEY) throw aiFailure({ response: { status: 401 } });
    const prompt = await getCrmContextForAi(userId, userMessage, conversationId);
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
            messages: [
                { role: 'system', content: prompt || 'You are a helpful assistant for a CRM dashboard.' },
                { role: 'user', content: userMessage }
            ],
            max_completion_tokens: 1500
        }, {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            timeout: 30000
        });
        const reply = response.data.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error('Empty AI response');
        return reply;
    } catch (error) {
        // Avoid logging axios request configuration, which contains the API key.
        console.error('AI request failed:', error.response?.status || error.code || 'empty_response');
        throw aiFailure(error);
    }
}
module.exports = { processWithAI, aiFailure };
