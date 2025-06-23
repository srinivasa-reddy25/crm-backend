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
            limit = 10,
            cursor,
            action,
            entityType,
            startDate,
            endDate
        } = req.query;

        // console.log("startDate : ", startDate);
        // console.log("endDate : ", endDate);

        const query = { user: userId };


        if (action) {
            query.action = action;
        }


        if (entityType) {
            query.entityType = entityType;
        }


        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }


        if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
            query._id = { $lt: cursor };
        }

        const pageLimit = Math.min(parseInt(limit), 100);
        console.log("Query being sent to MongoDB:", query);

        // const testActivities = await Activity.find({
        //     createdAt: {
        //         $gte: new Date("2025-06-01T00:00:00.000Z"),
        //         $lte: new Date("2025-06-30T23:59:59.999Z")
        //     }
        // }).sort({ createdAt: -1 }).limit(5);

        // console.log("Test date-filtered activities:", testActivities);

        const activities = await Activity.find(query)
            .sort({ _id: -1 })
            .limit(pageLimit + 1)
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
