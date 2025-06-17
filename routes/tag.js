const express = require('express');
const authenticate = require("../middleware/auth");
const validateCreateTag = require('../middleware/express-validator');


const TagRouter = express.Router();


const {
    getAllTags,
    createNewTag,
    getTagById,
    updateTagById,
    deleteTagById,
} = require('../controllers/tagController');



TagRouter.get('/', authenticate, getAllTags);
TagRouter.post('/', authenticate, validateCreateTag, createNewTag);
TagRouter.get('/:id', authenticate, getTagById);
TagRouter.put('/:id', authenticate, updateTagById);
TagRouter.delete('/:id', authenticate, deleteTagById);




module.exports = TagRouter;