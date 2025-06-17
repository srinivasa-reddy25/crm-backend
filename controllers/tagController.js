const { Tag } = require('../models/Tags');

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const User = require('../models/User'); // Assuming you have a User model

const getAllTags = async (req, res) => {
    try {

        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;

        const tags = await Tag.find({ createdBy: userId });
        res.status(200).json({ tags });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




const createNewTag = async (req, res) => {
    try {

        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //   return res.status(400).json({ errors: errors.array() });
        // }

        const { name, color } = req.body;


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;

        const existingTag = await Tag.findOne({ name, createdBy: userId });
        if (existingTag) {
            return res.status(409).json({ error: 'Tag with this name already exists.' });
        }




        console.log("User ID from middleware: ", userId);

        const newTag = new Tag({
            name,
            color,
            createdBy: userId,
        });

        await newTag.save();

        res.status(201).json({
            message: 'Tag created successfully',
            tag: newTag,
        });
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





const getTagById = async (req, res) => {
    try {

        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;


        const tagId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(tagId)) {
            return res.status(400).json({ error: 'Invalid tag ID' });
        }

        const tag = await Tag.findOne({
            _id: tagId,
            createdBy: userId,
        });

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.status(200).json(tag);
    } catch (error) {
        console.error('Error fetching tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





const updateTagById = async (req, res) => {
    try {


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;



        const tagId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(tagId)) {
            return res.status(400).json({ error: 'Invalid tag ID' });
        }

        const tag = await Tag.findOne({
            _id: tagId,
            createdBy: userId,
        });

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        const { name, color } = req.body;

        tag.name = name || tag.name;
        tag.color = color || tag.color;
        tag.updatedAt = new Date();

        await tag.save();

        res.status(200).json({
            message: 'Tag updated successfully',
            tag,
        });
    } catch (error) {
        console.error('Error updating tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const deleteTagById = async (req, res) => {
    try {


        const user = await User.findOne({ firebaseUID: req.user.uid });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;



        const tagId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(tagId)) {
            return res.status(400).json({ error: 'Invalid tag ID' });
        }

        const tag = await Tag.findOneAndDelete({
            _id: tagId,
            createdBy: userId,
        });

        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        res.status(200).json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};





module.exports = {
    getAllTags,
    createNewTag,
    getTagById,
    updateTagById,
    deleteTagById,
};
