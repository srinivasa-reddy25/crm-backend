const User = require('../models/User');
const { Contact } = require('../models/Contact');
const { Activity } = require('../models/Activities');
const { Conversation } = require('../models/Conversation');
const { ChatMessage } = require('../models/chatMessage');
// const { mongo } = require('mongoose');
// const { default: mongoose } = require('mongoose');

const mongoose = require('mongoose');


const getCrmContextForAi = async (userId, userMessage, conversationIdforAiMessage) => {

    const user = await User.findById(userId).lean();

    const contacts = await Contact.find({ createdBy: userId })
        .sort({ lastInteraction: -1 })
        // .limit(5)
        .populate('company', 'name')
        .populate('tags', 'name')

    const contactswithsummary = contacts.map(contact => contact.modifiedforAi)
    // console.log('Contacts for AI:', contactswithsummary);

    const newobjectId = new mongoose.Types.ObjectId(conversationIdforAiMessage);
    // console.log('Conversation ID for AI:', conversationIdforAiMessage);

    const chatmessage = await ChatMessage.find({ user: userId, conversationId: newobjectId })
        .sort({ timestamp: 1 })
        .lean()


    // console.log('Chat messages for AI:', chatmessage);

    const chatmessagewithsummary = chatmessage.map(message => {
        if (message.sender === 'ai') {
            return `AI Response: ${message.message}`;
        } else {
            return `User Message: ${message.message}`;
        }
    })

    // console.log('Chat messages with summary for AI:', chatmessagewithsummary);


    // for (let i = 0; i < chatmessage.length; i++) {
    //     const message = chatmessage[i];
    //     if (message.sender === 'ai') {
    //         const conversation = await Conversation.findById(newobjectId).lean();
    //         if (conversation) {
    //             message.modifiedforAi = `AI Response: ${message.message}`;
    //         } else {
    //             message.modifiedforAi = `AI Response: ${message.message} (Conversation not found)`;
    //         }
    //     } else {
    //         message.modifiedforAi = `User Message: ${message.message}`;
    //     }
    // }




    const activities = await Activity.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(5)

    const activitieswithsummary = activities.map(activity => activity.modifiedforAi);

    // console.log('Activities for AI:', activitieswithsummary);


    return `
        You are a helpful AI assistant supporting a CRM user. Use the following context to understand their recent activity and provide relevant responses.

        👤 User Information:
        • Name: ${user.displayName}
        • Email: ${user.email}
        • Preference: ${user.preference || "N/A"}

        📇 Recent Contacts:
        ${contactswithsummary.join('\n')}

        📌 Recent Activities:
        ${activitieswithsummary.join('\n')}

        💬 Recent Chat History:
        ${chatmessagewithsummary.join('\n')}

        📝 Current User Message:
        "${userMessage}"

        Respond helpfully using the above CRM context.
            `.trim();
}

module.exports = {
    getCrmContextForAi
};