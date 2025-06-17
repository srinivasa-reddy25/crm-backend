const { body } = require('express-validator');

const validateCreateContact = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
];

module.exports = validateCreateContact;