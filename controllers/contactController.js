// import Contact from "../models/Contact.js";

const { Contact } = require("../models/Contact");
const mongoose = require("mongoose");
const { Activity } = require('../models/Activities.js');
const { Tag } = require("../models/Tags.js");
const { Company } = require("../models/Company");
const User = require("../models/User.js");


const { validationResult } = require('express-validator');


const listallContacts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'asc' ? 1 : -1;


        const search = req.query.search;


        const user = await User.findOne({ firebaseUID: req.user.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = user._id;
        let query = { createdBy: userId };


        // const invalidTagIds = await req.query.tags?.split(',').filter(id => !mongoose.Types.ObjectId.isValid(id));
        // console.log(invalidTagIds)
        // if (invalidTagIds.length > 0) {
        //     console.warn("Invalid tag IDs:", invalidTagIds);
        //     return res.status(404).json({ error: 'Invalid Tag' });
        // }


        if (req.query.tag) {
            if (!mongoose.Types.ObjectId.isValid(req.query.tag)) {
                return res.status(400).json({ error: "Invalid tag ID" });
            }
            query.tags = req.query.tag;
        } else if (req.query.tags) {
            const rawTagIds = req.query.tags.split(',');
            const allAreValid = rawTagIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!allAreValid) {
                return res.status(400).json({ error: "One or more tag IDs are invalid" });
            }
            const tagIds = rawTagIds; // now we know all are valid
            const matchType = req.query.matchType || 'any';
            if (tagIds.length > 0) {
                if (matchType === 'all') {
                    query.tags = { $all: tagIds };
                } else {
                    query.tags = { $in: tagIds };
                }
            }
        }




        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }


        // if (tagFilter.length > 0) {
        //     query.tags = { $in: tagFilter.map(id => mongoose.Types.ObjectId(id)) };
        // }


        const contacts = await Contact.find(query)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .populate('tags')
            .populate({
                path: 'company',
                model: 'Company'
            });

        const total = await Contact.countDocuments(query);
        return res.status(200).json({
            contacts,
            total,
            page,
            limit
        });


    }
    catch (error) {
        console.error("Error fetching contacts:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
    // console.log(req.user.uid);
    // res.json({
    //     message: "List all contacts",
    //     userId: req.user.uid,
    //     // You can add more logic here to fetch contacts if needed
    // })


}

const createNewContact = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, company, notes, tags } = req.body;


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;


        // const userId = new mongoose.Types.ObjectId(req.body.id) || req.user.id; // Assuming userId is passed in the request body or from the authenticated user

        const existingContact = await Contact.findOne({ email, createdBy: userId });
        if (existingContact) {
            return res.status(409).json({ error: 'Contact with this email already exists.' });
        }



        // add another layer for checking does the company exist or not

        let existingCompanyid = null;

        if (company) {
            const existingCompany = await Company.findOne({ name: company, createdBy: userId });
            existingCompanyid = existingCompany ? existingCompany._id : null;
            if (existingCompany) {
                // existingCompany.usageCount += 1;
                // await existingCompany.save();
            } else {
                const newCompany = new Company({
                    name: company,
                    createdBy: userId,
                    usageCount: 1,
                });
                await newCompany.save();
                existingCompanyid = newCompany._id;
            }
        }

        if (tags && tags.length > 0) {
            const validTags = await Tag.find({ _id: { $in: tags } });

            if (validTags.length !== tags.length) {
                return res.status(400).json({ error: 'One or more tag IDs are invalid.' });
            }

            await Tag.updateMany(
                { _id: { $in: tags } },
                { $inc: { usageCount: 1 } }
            );
        }


        const newContact = new Contact({
            name,
            email,
            phone,
            company: existingCompanyid || null,
            notes,
            tags,
            createdBy: userId,
        });


        await newContact.save();

        await newContact.populate('tags');


        return res.status(201).json(
            {
                newContact,
                message: "Contact created successfully"
            }
        );


    } catch (error) {
        console.error("Error creating contact:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

const getContactById = async (req, res) => {

    try {
        const contactId = req.params.id;

        if (!contactId) {
            return res.status(400).json({ error: 'Contact ID is required' });
        }



        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({ error: 'Invalid contact ID' });
        }


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;




        const contact = await Contact.findOne({
            _id: contactId,
            createdBy: userId,
        }).populate('tags').populate('company');


        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }


        res.status(200).json(contact);

    } catch (error) {
        console.error('Error fetching contact by ID:', error);
        res.status(500).json({ error: 'Server error' });
    }

    // res.json({
    //     message: "Get contact by ID",
    //     contact: {
    //         id: "X7d93kA8sLp0wErTgqVn91UyZbNmKj2L",
    //         initials: "JS",
    //         name: "John Smith",
    //         email: "john.smith@techcorp.com",
    //         company: "TechCorp",
    //         tags: ["Hot Lead", "VIP"],
    //         tagColors: ["destructive", "secondary"],
    //         lastInteraction: "2 days ago",
    //         phone: "+1234567890",
    //         notes: "Interested in our new product line. Follow up next week.",
    //         createdAt: "2023-10-01T12:00:00Z",
    //         updatedAt: "2023-10-05T15:30:00Z",
    //         createdBy: "user123",
    //     }
    // })

}

const updateContactById = async (req, res) => {
    try {

        const contactId = req.params.id;
        console.log("Contact ID:", contactId);

        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({ error: 'Invalid contact ID' });
        }
        console.log("Valid Contact ID:", contactId);


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log("User found:", user);

        const userId = user._id;

        const existingContact = await Contact.findOne({
            _id: contactId,
            createdBy: userId,
        });


        if (!existingContact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        console.log("Contact found:", existingContact);
        console.log("Request body:", req.body);

        const { name, email, phone, company, notes, tags } = req.body;
        console.log("Request body fields:", { name, email, phone, company, notes, tags });



        // if (tags) {
        //     const validTags = await Tag.find({ _id: { $in: tags } });

        //     if (validTags.length !== tags.length) {
        //         return res.status(400).json({ error: 'Invalid tag IDs' });
        //     }

        //     await Tag.updateMany(
        //         { _id: { $in: tags } },
        //         { $inc: { usageCount: 1 } }
        //     );

        //     existingContact.tags = tags;
        // }

        // if (company) {
        //     const existingCompany = await Company.findOne({ name: company, createdBy: userId });
        //     if (existingCompany) {
        //         existingContact.company = existingCompany._id || existingContact.company;
        //     } else {
        //         return res.status(404).json({ error: 'Company not found' });
        //     }
        // } else {
        //     existingContact.company = null;
        // }




        const changes = {};
        const fieldsToCheck = ['name', 'email', 'phone', 'company', 'notes'];
        for (const field of fieldsToCheck) {
            const oldVal = existingContact[field]?.toString();
            const newVal = req.body[field]?.toString();

            if (req.body[field] !== undefined && oldVal !== newVal) {
                changes[field] = {
                    from: existingContact[field],
                    to: req.body[field]
                };
            }
        }

        if (tags) {
            const validTags = await Tag.find({ _id: { $in: tags } });

            if (validTags.length !== tags.length) {
                return res.status(400).json({ error: 'Invalid tag IDs' });
            }

            const oldTags = existingContact.tags.map(id => id.toString()).sort();
            const newTags = tags.map(id => id.toString()).sort();

            const tagsChanged = oldTags.length !== newTags.length ||
                oldTags.some((id, i) => id !== newTags[i]);

            if (tagsChanged) {
                // Fetch old tag names
                const oldTagDocs = await Tag.find({ _id: { $in: oldTags } });
                const newTagDocs = await Tag.find({ _id: { $in: newTags } });

                changes.tags = {
                    from: oldTagDocs.map(tag => tag.name),
                    to: newTagDocs.map(tag => tag.name)
                };

                existingContact.tags = tags;
            }

        }



        existingContact.name = name || existingContact.name;
        existingContact.email = email || existingContact.email;
        existingContact.phone = phone || existingContact.phone;
        existingContact.company = existingContact.company || null;
        existingContact.notes = notes || existingContact.notes;
        existingContact.updatedAt = new Date();
        existingContact.lastInteraction = new Date();

        await existingContact.save();
        await existingContact.populate('tags');




        if (Object.keys(changes).length > 0) {
            // const { Activity } = require('../models/Activity');
            await Activity.create({
                user: userId,
                action: 'contact_updated',
                entityType: 'contact',
                entityId: existingContact._id,
                entityName: existingContact.name,
                details: {
                    contactName: existingContact.name,
                    changes
                }
            });
        }

        res.status(200).json({
            message: "Contact updated successfully",
            contact: existingContact
        });

    } catch (error) {

    }
}

const deleteContactById = async (req, res) => {
    try {
        const contactId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({ error: 'Invalid contact ID' });
        }



        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;



        const contact = await Contact.findOneAndDelete({
            _id: contactId,
            createdBy: userId,
        });

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.status(200).json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

// const bulkImportContacts = async (req, res) => {
//     res.json({
//         message: "Bulk import contacts",
//     });
// }

const bulkDeleteContacts = async (req, res) => {

    try {

        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;
        const { ids } = req.body;


        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Contact IDs array is required.' });
        }


        const userContacts = await Contact.find({ _id: { $in: ids }, createdBy: userId });


        const userContactIds = userContacts.map(contact => contact._id.toString());

        const unauthorizedIds = ids.filter(id => !userContactIds.includes(id));

        if (unauthorizedIds.length > 0) {
            return res.status(403).json({ error: 'You are not authorized to delete some of the selected contacts.', unauthorizedIds });
        }

        const result = await Contact.deleteMany({ _id: { $in: ids }, createdBy: userId });


        await Activity.create({
            user: userId,
            action: 'bulk_delete',
            entityType: 'contact',
            entityId: null,
            details: {
                count: userContacts.length,
                names: userContacts.map(c => c.name),
                ids: ids
            }
        });



        res.status(200).json({
            message: 'Bulk delete successful',
            deletedCount: result.deletedCount
        });


    } catch (error) {
        console.error("Error in bulk delete contacts:", error);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}



module.exports = {
    listallContacts,
    createNewContact,
    getContactById,
    updateContactById,
    deleteContactById,
    // bulkImportContacts,
    bulkDeleteContacts
};