const { Contact } = require('../models/Contact');

// Count each contact once per tag, including legacy records with duplicate IDs.
async function getTagCounts(userId) {
    const rows = await Contact.aggregate([
        { $match: { createdBy: userId } },
        { $project: { tags: { $setUnion: [{ $ifNull: ['$tags', []] }, []] } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map(row => [String(row._id), row.count]));
}

async function withContactCounts(tags, userId) {
    const counts = await getTagCounts(userId);
    return tags.map(tag => ({ ...tag, usageCount: counts.get(String(tag._id)) || 0 }));
}

module.exports = { getTagCounts, withContactCounts };
