const express = require('express');
const authenticate = require("../middleware/auth");
const validateCreateTag = require('../middleware/express-validator');


const CompanyRouter = express.Router();



const {
    listAllCompanies,
    createNewCompany,
    getCompanyById,
    updateCompanyById,
    deleteCompanyById,
} = require('../controllers/companyController');



CompanyRouter.get('/', authenticate, listAllCompanies);
CompanyRouter.post('/', authenticate, validateCreateTag, createNewCompany);
CompanyRouter.get('/:id', authenticate, getCompanyById);
CompanyRouter.put('/:id', authenticate, updateCompanyById);
CompanyRouter.delete('/:id', authenticate, deleteCompanyById);


module.exports = CompanyRouter;