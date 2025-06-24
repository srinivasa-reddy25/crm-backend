function buildPrompt(context, userMessage) {
    const { user, contacts, tags, companies, activities } = context;

    const contactSummary = contacts.map(c => {
        const tagList = (c.tags || []).map(tid => {
            const tag = tags.find(t => t._id.toString() === tid.toString());
            return tag ? tag.name : null;
        }).filter(Boolean).join(", ");

        const company = companies.find(co => co._id.toString() === c.company?.toString());

        return `- ${c.name} (${c.email}) | Tags: ${tagList || "None"} | Notes: ${c.notes || "None"} | Company: ${company?.name || "N/A"}`;
    }).join("\n");

    const activitySummary = activities.map(a => {
        return `• ${a.action} on ${a.entityType} (${a.entityId}) at ${a.timestamp}`;
    }).join("\n");

    return `
You're an AI assistant helping a CRM user. Here's their context:

👤 User: ${user.displayName} (${user.email})
📝 Preference: ${user.preference || "N/A"}

📇 Recent Contacts:
${contactSummary}

📌 Recent Activities:
${activitySummary}

User Message:
"${userMessage}"

Respond helpfully using the above CRM context.
    `.trim();
}


module.exports = { buildPrompt };