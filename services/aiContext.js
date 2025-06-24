const User = require('../models/User');
const { Contact } = require('../models/contact');
const { Activity } = require('../models/Activities');



const getCrmContextForAi = async (userId, userMessage) => {

    const user = await User.findById(userId).lean();

    const contacts = await Contact.find({ createdBy: userId })
        .sort({ lastInteraction: -1 })
        // .limit(5)
        .populate('company', 'name')
        .populate('tags', 'name')

    const contactswithsummary = contacts.map(contact => contact.modifiedforAi)
    // console.log('Contacts for AI:', contactswithsummary);

    const activities = await Activity.find({ user: userId })
        .sort({ timestamp: -1 })
        .limit(5)

    const activitieswithsummary = activities.map(activity => activity.modifiedforAi);

    // console.log('Activities for AI:', activitieswithsummary);

    return `
   You are a helpful AI assistant supporting a CRM user. Use the following context to understand their recent activity and provide relevant responses.
    
    👤 User Information:
    • Name: ${user.displayName}
    • Email: ${user.email}
    • Preference: ${user.preference || "N/A"}

    📇 Recent Contacts:
    ${contactswithsummary}

    📌 Recent Activities:
    ${activitieswithsummary}

    User Message:
    "${userMessage}"

    Respond helpfully using the above CRM context.
        `.trim();
}

module.exports = {
    getCrmContextForAi
};
