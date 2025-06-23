const mongoose = require('mongoose');
const { Schema } = mongoose;
const objectId = mongoose.Schema.Types.ObjectId;



const chatMessageSchema = mongoose.Schema({
    user: {
        type: objectId,
        ref: 'User',
        required: true
    },

    message: {
        type: String,
        required: true
    },

    sender: {
        type: String,
        enum: ['user', 'ai'],
        required: true
    },

    timestamp: {
        type: Date,
        default: Date.now
    },

    conversationId: {
        type: String,
        required: true,
        index: true
    },

});

const ChatMessage = mongoose.models.ChatMessage || mongoose.model("ChatMessage", chatMessageSchema);
module.exports = { ChatMessage };