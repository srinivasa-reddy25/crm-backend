const { ChatMessage } = require('../models/chatMessage');
const { Conversation } = require('../models/Conversation');


async function CreateConversation(userId) {
    // let conversation = await Conversation.findOne({
    //     user: userId,
    //     isArchived: false
    // }).sort({ lastUpdated: -1 });

    const conversation = new Conversation({
        user: userId,
        title: `Conversation - ${new Date().toLocaleString()}`,
        createdAt: new Date(),
        lastUpdated: new Date(),
        isArchived: false,
    });
    await conversation.save();

    return conversation;
}


async function saveMessage(userId, messageText, sender, conversationId) {
    let conversation;

    // When valid conversationId is provided
    if (conversationId && conversationId !== 'new') {
        conversation = await Conversation.findOne({
            _id: conversationId,
            user: userId,
            isArchived: false,
        });

        if (!conversation) {
            throw new Error('❌ Conversation not found or unauthorized');
        }
    } else {
        conversation = await CreateConversation(userId);
    }

    conversation.lastUpdated = new Date();
    await conversation.save();

    const message = new ChatMessage({
        user: userId,
        message: messageText,
        sender,
        timestamp: new Date(),
        conversationId: conversation._id,
        metadata: {
            messageType: 'text',
        },
    });

    await message.save();

    if (conversationId === 'new') {
        return {
            conversationId: conversation._id,
            message,
        };
    }

    return message;
}

module.exports = { saveMessage, CreateConversation };
