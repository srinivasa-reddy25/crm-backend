const axios = require('axios');
const { getCrmContextForAi } = require('./aiContext');

function aiFailure(error) {
    if (error.code?.startsWith('AI_')) return error;
    const status = error.response?.status;
    const upstream = error.response?.data?.error || {};
    const quota = status === 429;
    const credentials = status === 401 || status === 403 ||
        (status === 400 && /API_KEY_INVALID|API key not valid/i.test(JSON.stringify(upstream)));
    const result = new Error(quota
        ? 'Gemini has reached this project’s request or token limit. Wait for the quota to reset, then retry.'
        : credentials
            ? 'Gemini is not configured or the API key lacks access. Update GEMINI_API_KEY on the backend.'
            : status === 404
                ? 'The configured Gemini model is unavailable. Update GEMINI_MODEL on the backend.'
                : error.code === 'ECONNABORTED'
                    ? 'The AI service took too long to respond. Please retry.'
                    : 'The AI service could not complete your message. Please retry.');
    result.code = quota ? 'AI_QUOTA_EXHAUSTED' : 'AI_UNAVAILABLE';
    return result;
}

async function processWithAI(userMessage, userId, conversationId) {
    if (!process.env.GEMINI_API_KEY) throw aiFailure({ response: { status: 401 } });
    const prompt = await getCrmContextForAi(userId, userMessage, conversationId);
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            systemInstruction: { parts: [{ text: prompt || 'You are a helpful assistant for a CRM dashboard.' }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 1500 },
        }, {
            headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
            timeout: 30000,
        });
        const candidate = response.data.candidates?.[0];
        if (response.data.promptFeedback?.blockReason ||
            ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'RECITATION', 'SPII'].includes(candidate?.finishReason)) {
            throw Object.assign(new Error('Gemini could not answer this request. Please rephrase your message.'), { code: 'AI_RESPONSE_BLOCKED' });
        }
        if (candidate?.finishReason === 'MAX_TOKENS') {
            throw Object.assign(new Error('The answer exceeded the response limit. Please ask a more focused question.'), { code: 'AI_RESPONSE_TOO_LONG' });
        }
        const reply = candidate?.content?.parts?.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('').trim();
        if (!reply) throw new Error('Empty AI response');
        return reply;
    } catch (error) {
        // Never log axios configuration: it includes credentials and CRM context.
        console.error('AI request failed:', error.response?.status || error.code || 'empty_response');
        throw aiFailure(error);
    }
}
module.exports = { processWithAI, aiFailure };
