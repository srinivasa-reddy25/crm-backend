const express = require('express');
const conversationRouter = express.Router();
const { getUserConversations } = require('../controllers/conversationController');

const authenticate = require('../middleware/auth');



conversationRouter.get('/', authenticate, getUserConversations);

module.exports = conversationRouter;