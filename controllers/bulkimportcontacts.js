const fs = require('fs');
const csv = require('csv-parser');
const { Contact } = require('../models/Contact');

const { Company } = require("../models/Company")
const { Tag } = require('../models/Tags');

const { Activity } = require('../models/Activities');


const User = require('../models/User');


const bulkImportContacts = async (req, res) => {

    const filePath = req.file?.path;

    if (!filePath) {
        return res.status(400).json({ error: 'CSV file not provided.' });
    }


    const user = await User.findOne({ firebaseUID: req.user.uid });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userId = user._id;
    const contacts = [];
    const failed = [];
    const batchSize = parseInt(process.env.CSV_BATCH_SIZE || '100');



    try {


        const fileStream = fs.createReadStream(filePath).pipe(csv());


        for await (const row of fileStream) {
            const { name, email, phone, company, notes, tags } = row;
            console.log("row : ", row);

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
                console.log("existingCompanyid : ", existingCompanyid);
            }

            if (tags) {
                const tagNames = tags.split(';').map(tag => tag.trim());
                const tagIds = await Promise.all(tagNames.map(async (tagName) => {
                    let tag = await Tag.findOne({ name: tagName, createdBy: userId });
                    if (!tag) {
                        tag = new Tag({ name: tagName, createdBy: userId });
                        await tag.save();
                    }
                    return tag._id;
                }));
                row.tags = tagIds;
            }





            if (!name || !email) {
                failed.push({ row, reason: 'Missing required fields' });
                continue;
            }

            const existing = await Contact.findOne({ email, createdBy: userId });
            if (existing) {
                failed.push({ row, reason: 'Duplicate email' });
                continue;
            }

            contacts.push({
                name,
                email,
                tags: row.tags || [],
                phone,
                company: existingCompanyid || null,
                notes,
                createdBy: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });


            if (contacts.length >= batchSize) {
                await Contact.insertMany(contacts);
                contacts.length = 0;
            }

        }
        // return res.json({
        //     message: 'Processing row',
        //     successCount: contacts.length,
        //     failureCount: failed.length,
        // })

        if (contacts.length > 0) {
            await Contact.insertMany(contacts);
        }

        fs.unlinkSync(filePath);



        try {
            await Activity.create({
                user: userId,
                action: 'bulk_import',
                entityType: 'contact',
                entityId: null,
                details: {
                    successCount: contacts.length,
                    failureCount: failed.length,
                    failedReasons: failed.map(f => ({
                        email: f.row.email,
                        reason: f.reason
                    }))
                }
            });
        } catch (logError) {
            console.error("Activity logging failed for bulk import:", logError);
        }






        res.status(200).json({
            message: 'Import complete',
            successCount: contacts.length,
            failureCount: failed.length,
            failed,
        });


    } catch (error) {
        console.error('Error during bulk import:', error);
        res.status(500).json({
            error: 'Internal server error during bulk import',
            details: error.message,
        });
    }

}


module.exports = {
    bulkImportContacts,
};