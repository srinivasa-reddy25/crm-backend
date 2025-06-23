const express = require('express');

const authenticate = require("../middleware/auth");

const dashboardRouter = express.Router();


const { getSummaryMetrics, getContactByCompany, activitiesTimeline,tagDistribution } = require('../controllers/dashboardController');



dashboardRouter.get('/summary', authenticate, getSummaryMetrics);
dashboardRouter.get('/contacts-by-company', authenticate, getContactByCompany);
dashboardRouter.get('/activities-timeline', authenticate, activitiesTimeline);
dashboardRouter.get('/tag-distribution', authenticate, tagDistribution);




module.exports = dashboardRouter;