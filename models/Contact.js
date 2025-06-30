const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const { Activity } = require('./Activities');

const contactSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    company: { type: ObjectId, ref: 'Company' },
    tags: [{ type: ObjectId, ref: 'Tag' }],
    notes: String,
    createdBy: { type: ObjectId, ref: 'User' },
    createdAt: Date,
    updatedAt: Date,
    lastInteraction: Date
}, { timestamps: true }
);



contactSchema.pre('save', function (next) {
    this._wasNew = this.isNew;
    next();
})

contactSchema.index({ email: 1, createdBy: 1 }, { unique: true });

contactSchema.index({ name: 'text', email: 'text' });


contactSchema.post('save', async function (doc, next) {
    if (this._wasNew) {
        console.log('New contact created:', doc.name);
        try {
            await Activity.create({
                user: doc.createdBy,
                action: 'contact_created',
                entityType: 'contact',
                entityId: doc._id,
                entityName: doc.name,
                details: {
                    contactName: doc.name,
                    company: doc.company,
                    email: doc.email
                }
            });
        } catch (err) {
            console.error('Activity logging failed (creation):', err);
        }
    }
    next();
});

contactSchema.pre('findOneAndDelete', async function (next) {
    this._toDelete = await this.model.findOne(this.getQuery());
    next();
});

contactSchema.post('findOneAndDelete', async function (result, next) {
    const deletedContact = this._toDelete;
    if (!deletedContact) return next();

    try {

        await Activity.create({
            user: deletedContact.createdBy,
            action: 'contact_deleted',
            entityType: 'contact',
            entityId: deletedContact._id,
            entityName: deletedContact.name,
            details: {
                contactName: deletedContact.name,
                email: deletedContact.email,
                company: deletedContact.company
            }
        });
    } catch (err) {
        console.error('Activity logging failed (delete):', err);
    }

    next();
});


contactSchema.virtual('modifiedforAi').get(function () {
    return `${this.name} can be reached at ${this.email}. They are currently employed at ${this.company ? this.company?.name : 'an unknown company'}. The last recorded interaction was on ${this.lastInteraction ? this.lastInteraction.toLocaleDateString() : 'an unknown date'}. Notes: ${this.notes || 'No notes available'}. Tags associated: ${this.tags && this.tags.length > 0 ? this.tags.map(tag => tag.name).join(', ') : 'No tags'}.`;
})
// contactSchema.set('toObject', { virtuals: true });
// contactSchema.set('toJSON', { virtuals: true });




const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
// const Contact = mongoose.model("Contact", contactSchema);
module.exports = { Contact };
