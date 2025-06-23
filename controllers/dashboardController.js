const { Contact } = require("../models/Contact.js");
const { Tag } = require("../models/Tags.js");
const { Company } = require("../models/Company.js");
const { Activity } = require("../models/Activities.js");
const { model } = require("mongoose");

const User = require("../models/User.js");


const getSummaryMetrics = async (req, res) => {
    try {

        const now = new Date();
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);

        const user = await User.findOne({ firebaseUID: req.user.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = user._id;

        console.log("User ID : ", userId)


        const totalContacts = await Contact.countDocuments({ createdBy: userId });
        console.log("Total Contacts : ", totalContacts)


        const newContactsThisWeek = await Contact.countDocuments({
            createdBy: userId,
            createdAt: { $gte: lastWeek, $lte: new Date() }
        });
        console.log("New Contacts This Week : ", newContactsThisWeek)


        const totalActivities = await Activity.countDocuments({ user: userId });

        console.log("User ID:", userId);
        console.log("lastWeek:", lastWeek.toISOString());
        console.log("Now:", new Date().toISOString());


        const tagAggregation = await Contact.aggregate([
            { $match: { createdBy: userId } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags" } },
            { $count: "uniqueTags" }
        ]);


        const activeTags = tagAggregation[0]?.uniqueTags || 0;

        const lastWeekStats = {
            totalContacts: 1100,
            newContacts: 41,
            totalActivities: 10,
            activeTags: 1
        };

        const getTrend = (current, previous) =>
            previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);

        res.json({
            totalContacts: {
                value: totalContacts,
                trend: getTrend(totalContacts, lastWeekStats.totalContacts)
            },
            newContactsThisWeek: {
                value: newContactsThisWeek,
                trend: getTrend(newContactsThisWeek, lastWeekStats.newContacts)
            },
            totalActivities: {
                value: totalActivities,
                trend: getTrend(totalActivities, lastWeekStats.totalActivities)
            },
            activeTags: {
                value: activeTags,
                trend: getTrend(activeTags, lastWeekStats.activeTags)
            }
        });

    } catch (error) {
        console.error("Error fetching summary metrics:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

}

const getContactByCompany = async (req, res) => {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const userId = user._id;
    try {
        const result = await Contact.aggregate([
            { $match: { createdBy: userId } },
            { $group: { _id: "$company", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "companies",
                    localField: "_id",
                    foreignField: "_id",
                    as: "companyDetails"
                }
            },
            { $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$companyDetails.name", "Unknown"] }, count: 1 } }
        ])

        res.json(result)
    } catch (err) {
        console.error("Error:", err)
        res.status(500).json({ error: "Server error" })
    }
}

const activitiesTimeline = async (req, res) => {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const userId = user._id;

    try {

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)


        const result = await Activity.aggregate([
            {
                $match: {
                    user: userId,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%b %d", date: "$timestamp" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])

        res.json(result.map(item => ({ date: item._id, count: item.count })))


    } catch (error) {
        console.error("Error fetching activities timeline:", error);
        return res.status(500).json({ error: "Internal server error" });
    }




}

const tagDistribution = async (req, res) => {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const userId = user._id;
    try {
        const result = await Contact.aggregate([
            { $match: { createdBy: userId } },
            { $unwind: "$tags" },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "tags",
                    localField: "_id",
                    foreignField: "_id",
                    as: "tagDetails"
                }
            },
            {
                $unwind: {
                    path: "$tagDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    name: { $ifNull: ["$tagDetails.name", "Unknown"] },
                    value: "$count"
                }
            },
            { $sort: { value: -1 } }
        ]);

        res.json(result);
    } catch (err) {
        console.error("Error:", err)
        res.status(500).json({ error: "Server error" })
    }
}




module.exports = {
    getSummaryMetrics,
    getContactByCompany,
    activitiesTimeline,
    tagDistribution
};