// server/socket.js
console.log('🔌 Initializing Socket.IO...');


const { Server } = require('socket.io');

const { saveMessage } = require('../services/chatService');
const { processWithAI } = require('../services/aiService');
const { ChatMessage } = require('../models/chatMessage');
const { Conversation } = require('../models/Conversation');

const socketAuthMiddleware = require('../middleware/socketAuth');


async function handleClearConversation(socket, { userId, conversationId }) {
    try {
        if (!userId || !conversationId) {
            return socket.emit('clear-conversation-error', 'Missing userId or conversationId');
        }

        await ChatMessage.deleteMany({ user: userId, conversationId });

        await Conversation.findByIdAndUpdate(conversationId, { isArchived: true });

        socket.emit('conversation-cleared', { conversationId });
    } catch (error) {
        console.error('❌ Error clearing conversation:', error.message);
        socket.emit('clear-conversation-error', 'Failed to clear conversation');
    }
}



async function handleGetChatHistory(socket, userId, conversationId, page = 1, limit = 20) {

    console.log(`🔍 Fetching chat history for user ${userId} in conversation ${conversationId}, page ${page}, limit ${limit}`);

    try {
        if (!userId || !conversationId) return;

        // if (conversationId === 'new') {
        //     console.warn('❗ Attempted to fetch history for a new conversation');
        //     return socket.emit('chat-history-error', 'Cannot fetch history for a new conversation');
        // }

        const messages = await ChatMessage.find({
            user: userId,
            conversationId
        })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        socket.emit('chat-history', messages.reverse());

    } catch (error) {
        console.error('Failed to fetch chat history:', error.message);
        socket.emit('chat-history-error', 'Unable to load messages.');
    }
}



function setupSocketIO(server, options = {}) {
    const io = new Server(server, {
        cors: {
            origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        ...options
    });

    console.log('✅ Socket.IO setup complete');

    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        const { uid } = socket.user;
        console.log(`🧠 New socket connection established: ${socket.id}`);


        console.log('🔌 New client connected:', socket.id);

        socket.on('join-chat', () => {
            socket.join(`chat-${uid}`);
            console.log(`✅ ${uid} joined chat-${uid}`);
        })

        socket.on('get-chat-history', ({ conversationId }) => {
            handleGetChatHistory(socket, uid, conversationId);
        })


        socket.on('clear-conversation', (payload) => {
            handleClearConversation(socket, payload);
        })

        socket.on('send-message', async (data) => {
            const { message, conversationId } = data;
            const userId = uid;
            try {
                if (!userId || !message?.trim()) return;

                const userMsg = await saveMessage(userId, message, 'user', conversationId);

                // if (conversationId === 'new') {
                //     const newconvesationId = userMsg.conversationId;
                // }

                let conversationIdforAiMessage = conversationId;
                if (conversationId === 'new') {
                    conversationIdforAiMessage = userMsg.conversationId;
                }

                socket.emit('ai-typing', true);

                const aiResponse = await processWithAI(message, userId);

                const aiMsg = await saveMessage(userId, aiResponse, 'ai', conversationIdforAiMessage);

                socket.emit('ai-typing', false);

                socket.emit('new-message', aiMsg);

            } catch (error) {
                console.error('❌ Error processing message:', error.message);
                socket.emit('error-message', 'Something went wrong. Please try again.');
            }
        });

        socket.on('disconnect', () => {
            console.log(`👋 Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

module.exports = setupSocketIO;
