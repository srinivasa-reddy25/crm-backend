const Activity = require('../models/Activity');


const logActivity = async ({ userId, action, entityType, entityId, details = {} }) => {
    try {
        await Activity.create({
            user: userId,
            action,
            entityType,
            entityId,
            details,
        });
    } catch (error) {
        console.error('Failed to log activity:', error.message);
        // Don't throw error — logging should never break the main feature
    }
};

module.exports = {
    logActivity,
};
