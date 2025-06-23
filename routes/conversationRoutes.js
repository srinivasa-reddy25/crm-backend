const express = require('express');
const conversationRouter = express.Router();
const { getUserConversations } = require('../controllers/conversationController');



conversationRouter.get('/:userId', getUserConversations);

module.exports =  conversationRouter ;