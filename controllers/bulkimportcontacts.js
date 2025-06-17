const fs = require('fs');
const csv = require('csv-parser');
const Contact = require('../models/Contact');

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
            const { name, email, phone, company, notes } = row;

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
                phone,
                company,
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

        if (contacts.length > 0) {
            await Contact.insertMany(contacts);
        }

        fs.unlinkSync(filePath);


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