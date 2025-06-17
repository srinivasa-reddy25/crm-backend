// import Contact from "../models/Contact.js";

const { Contact } = require("../models/Contact.js");

const mongoose = require("mongoose");

const { Tag } = require("../models/Tags.js");
const { Company } = require("../models/Company.js");

const User = require("../models/User.js"); // Assuming you have a User model


// import validationResult from 'express-validator';

const { validationResult } = require('express-validator');


const listallContacts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;


        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'asc' ? 1 : -1;


        const search = req.query.search;
        const tagFilter = req.query.tags ? req.query.tags.split(',') : [];


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;



        let query = { createdBy: userId };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
            ];
        }


        if (tagFilter.length > 0) {
            query.tags = { $in: tagFilter.map(id => mongoose.Types.ObjectId(id)) };
        }

        const contacts = await Contact.find(query)
            .sort({ [sortBy]: order })
            .skip(skip)
            .limit(limit)
            .populate('tags');

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

        const existingContact = await Contact.findOne({ email }, { createdBy: userId });
        if (existingContact) {
            return res.status(409).json({ error: 'Contact with this email already exists.' });
        }



        // add another layer for checking does the company exist or not

        let existingCompanyid = null;

        if (company) {
            const existingCompany = await Company.findOne({ name: company, createdBy: userId });
            existingCompanyid = existingCompany ? existingCompany._id : null;
            // if (existingCompany) {
            //     existingCompany.usageCount += 1;
            //     await existingCompany.save();
            // } else {
            //     const newCompany = new Company({
            //         name: company,
            //         createdBy: userId,
            //         usageCount: 1,
            //     });
            //     await newCompany.save();
            // }
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
        }).populate('tags');


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

        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({ error: 'Invalid contact ID' });
        }

        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;



        const existingContact = await Contact.findOne({
            _id: contactId,
            createdBy: userId,
        });


        if (!existingContact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        const { name, email, phone, company, notes, tags } = req.body;

        if (tags) {
            const validTags = await Tag.find({ _id: { $in: tags } });

            if (validTags.length !== tags.length) {
                return res.status(400).json({ error: 'Invalid tag IDs' });
            }

            await Tag.updateMany(
                { _id: { $in: tags } },
                { $inc: { usageCount: 1 } }
            );

            existingContact.tags = tags;
        }


        existingContact.name = name || existingContact.name;
        existingContact.email = email || existingContact.email;
        existingContact.phone = phone || existingContact.phone;
        existingContact.company = company || existingContact.company;
        existingContact.notes = notes || existingContact.notes;
        existingContact.updatedAt = new Date();
        existingContact.lastInteraction = new Date();

        await existingContact.save();
        await existingContact.populate('tags');


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