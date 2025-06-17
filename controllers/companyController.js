const { Company } = require('../models/Company');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const listAllCompanies = async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;

        const companies = await Company.find({ createdBy: userId });
        res.status(200).json({ companies });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const createNewCompany = async (req, res) => {
    try {
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({ errors: errors.array() });
        // }
        
        const { name, description, industry, website } = req.body;



        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;


        const existing = await Company.findOne({ name, createdBy: userId });
        if (existing) {
            return res.status(409).json({ error: 'Company with this name already exists.' });
        }

        const newCompany = new Company({
            name,
            description,
            industry,
            website,
            createdBy: userId,
        });

        await newCompany.save();

        res.status(201).json({
            message: 'Company created successfully',
            company: newCompany,
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;



        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;




        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const company = await Company.findOne({
            _id: companyId,
            createdBy: userId,
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.status(200).json(company);
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const updateCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;


        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const company = await Company.findOne({
            _id: companyId,
            createdBy: userId,
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        const { name, description, industry, website } = req.body;

        company.name = name || company.name;
        company.description = description || company.description;
        company.industry = industry || company.industry;
        company.website = website || company.website;
        company.updatedAt = new Date();

        await company.save();

        res.status(200).json({
            message: 'Company updated successfully',
            company,
        });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const deleteCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;






        if (!mongoose.Types.ObjectId.isValid(companyId)) {
            return res.status(400).json({ error: 'Invalid company ID' });
        }

        const company = await Company.findOneAndDelete({
            _id: companyId,
            createdBy: userId,
        });

        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }

        res.status(200).json({ message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    listAllCompanies,
    createNewCompany,
    getCompanyById,
    updateCompanyById,
    deleteCompanyById,
};
