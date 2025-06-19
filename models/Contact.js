const mongoose = require("mongoose");
const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const { Activity } = require('./Activities');

const contactSchema = new Schema({
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
});


let wasNew = false;

contactSchema.pre('save', function (next) {
    wasNew = this.isNew; 
    this.updatedAt = Date.now();
    next();
});

contactSchema.index({ name: 'text', email: 'text' });


contactSchema.post('save', async function (doc, next) {
    try {
        await Activity.create({
            user: doc.createdBy,
            action: wasNew ? 'contact_created' : 'contact_updated',
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
        console.error('Activity logging failed (save):', err);
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

const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
module.exports = { Contact };
