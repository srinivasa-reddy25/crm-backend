const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const TagSchema = mongoose.Schema({
    name: { type: String, required: true },
    color: { type: String, default: '#gray' },
    createdBy: { type: ObjectId, ref: 'User' },
    usageCount: { type: Number, default: 0 }
}, {
    timestamps: true
});

TagSchema.index({ name: 1, createdBy: 1 }, { unique: true });


TagSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
}
);



const Tag = mongoose.models.Tag || mongoose.model("Tag", TagSchema);

// const Tag = mongoose.model('Tag', TagSchema);


module.exports = { Tag };







