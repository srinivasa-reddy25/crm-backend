const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const activitySchema = new Schema({
    user: { type: ObjectId, ref: 'User', required: true },
    action: {
        type: String,
        enum: [
            'contact_created',
            'contact_updated',
            'contact_deleted',
            'bulk_import',
            'bulk_delete',
            'user_login',
        ],
        required: true
    },
    entityType: String,
    entityId: ObjectId,
    entityName: String,
    details: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
});


activitySchema.index({ user: 1, createdAt: -1 });

activitySchema.index({ entityType: 1 });





const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);

module.exports = { Activity };