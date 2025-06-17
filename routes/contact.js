const express = require('express');

const upload = require('../middleware/upload');

const authenticate = require("../middleware/auth");

const { bulkImportContacts } = require('../controllers/bulkimportcontacts');

const validateCreateContact = require('../middleware/express-validator');


const router = express.Router()

const {
    listallContacts,
    createNewContact,
    getContactById,
    updateContactById,
    deleteContactById,
    bulkDeleteContacts
} = require('../controllers/contactController');




router.get('/', authenticate, listallContacts);
router.post('/', authenticate, validateCreateContact, createNewContact);
router.get('/:id', authenticate, getContactById);
router.put('/:id', authenticate, updateContactById);
router.delete('/:id', authenticate, deleteContactById);

router.post('/bulk-import', authenticate, upload.single('file'), bulkImportContacts);
router.post('/bulk-delete', authenticate, bulkDeleteContacts);

module.exports = router;