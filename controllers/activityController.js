const { Activity } = require('../models/Activities');
const User = require('../models/User');
const mongoose = require('mongoose');

const getActivities = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;
        const {
            limit = 20,
            cursor,
            action,
            entityType,
            startDate,
            endDate
        } = req.query;

        const query = { user: userId };

        // Action type filter (e.g. contact_created)
        if (action) {
            query.action = action;
        }

        // Entity type filter (e.g. contact, tag)
        if (entityType) {
            query.entityType = entityType;
        }

        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Cursor-based pagination (infinite scroll)
        if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
            query._id = { $lt: cursor };
        }

        const pageLimit = Math.min(parseInt(limit), 100); // Max 100 per page

        const activities = await Activity.find(query)
            .sort({ _id: -1 }) // Newest first
            .limit(pageLimit + 1) // Fetch one extra to check hasMore
            .populate('user', 'name email avatar');

        const hasMore = activities.length > pageLimit;
        if (hasMore) activities.pop();

        const nextCursor = hasMore ? activities[activities.length - 1]._id : null;

        return res.status(200).json({
            activities,
            nextCursor,
            hasMore
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

module.exports = {
    getActivities
};
