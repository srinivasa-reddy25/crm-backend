const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;


const contactSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    company: { type: ObjectId, ref: 'Company' },
    tags: [{ type: ObjectId, ref: 'Tag' }],
    notes: String,
    createdBy: { type: ObjectId, ref: 'User' },
    createdAt: Date,
    updatedAt: Date,
    lastInteraction: Date
})

contactSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

contactSchema.index({
    name: 'text'
    , email: 'text'
    , company: 'text'
});


const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);

module.exports = { Contact };