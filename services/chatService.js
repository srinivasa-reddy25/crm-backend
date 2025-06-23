

const { ChatMessage } = require('../models/chatMessage');
const { Conversation } = require('../models/Conversation');



async function getOrCreateConversation(userId) {
    let conversation = await Conversation.findOne({ user: userId, isArchived: false })
        .sort({ lastUpdated: -1 });

    if (!conversation) {
        conversation = new Conversation({
            user: userId,
            title: `Conversation - ${new Date().toLocaleString()}`
        });
        await conversation.save();
    }

    return conversation;
}



async function saveMessage(userId, messageText, sender, conversationId = null) {
    let conversation;

    if (conversationId) {
        conversation = await Conversation.findOne({
            _id: conversationId,
            user: userId,
            isArchived: false,
        });

        if (!conversation) {
            throw new Error('❌ Conversation not found or unauthorized');
        }
    } else {
        conversation = await getOrCreateConversation(userId);
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
    return message;
}

module.exports = { saveMessage, getOrCreateConversation };
