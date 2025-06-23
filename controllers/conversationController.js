const { Conversation } = require('../models/Conversation');
const User = require('../models/User');

async function getUserConversations(req, res) {

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const userId = user._id;

    try {
        const conversations = await Conversation.find({ user: userId, isArchived: false })
            .sort({ lastUpdated: -1 })
            .lean();
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error.message);
        res.status(500).json({ message: 'Failed to load conversations.' });
    }
}

module.exports = { getUserConversations };