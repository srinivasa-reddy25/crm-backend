
const User = require('../models/User');
const { Contact } = require('../models/Contact');
const { Activity } = require('../models/Activities');
const { Tag } = require('../models/Tags');
const { Company } = require('../models/Company');

async function buildUserContext(userId) {
    const user = await User.findById(userId).lean();
    const contacts = await Contact.find({ createdBy: userId }).limit(5).lean();
    const activities = await Activity.find({ user: userId }).sort({ timestamp: -1 }).limit(5).lean();


    const tagIds = contacts.flatMap(c => c.tags || []);
    const tags = await Tag.find({ _id: { $in: tagIds } }).lean();
    const companyIds = contacts.map(c => c.company).filter(Boolean);
    const companies = await Company.find({ _id: { $in: companyIds } }).lean();

    return {
        user,
        contacts,
        tags,
        companies,
        activities
    };
}

module.exports = {
    buildUserContext
};
