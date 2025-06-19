const express = require('express');
const router = express.Router();
const { getActivities } = require('../controllers/activityController');
const authenticate = require('../middleware/auth'); 

router.get('/', authenticate, getActivities);

module.exports = router;
