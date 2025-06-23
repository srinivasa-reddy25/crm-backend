const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const conversationSchema = new Schema({
    user: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Conversation' },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    isArchived: {
        type: Boolean,
        default: false
    }
});

conversationSchema.index({ user: 1, lastUpdated: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
module.exports = { Conversation };