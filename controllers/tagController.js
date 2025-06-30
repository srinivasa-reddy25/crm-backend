const { Tag } = require('../models/Tags');

const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

const User = require('../models/User'); // Assuming you have a User model
const { Contact } = require('../models/Contact'); // Assuming you have a Contact model

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

        const user = await User.findOne({ firebaseUID: req.user.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = user._id;

        const tagsData = Array.isArray(req.body.tags) ? req.body.tags : [req.body];

        if (tagsData.length === 0) {
            return res.status(400).json({ error: 'No tags provided' });
        }

        const createdTags = [];
        const errors = [];


        for (const tagData of tagsData) {
            const { name, color } = tagData;

            if (!name || !color) {
                errors.push({ tag: tagData, error: 'Name and color are required' });
                continue;
            }

            const existingTag = await Tag.findOne({ name, createdBy: userId });
            if (existingTag) {
                errors.push({ tag: tagData, error: 'Tag with this name already exists' });
                continue;
            }

            const newTag = new Tag({
                name,
                color,
                createdBy: userId,
            });

            await newTag.save();
            createdTags.push(newTag);
        }


        const response = {
            message: `${createdTags.length} tag(s) created successfully`,
            tags: createdTags
        };


        if (errors.length > 0) {
            response.errors = errors;
        }

        const statusCode = createdTags.length > 0 ?
            (errors.length > 0 ? 207 : 201) :
            400;

        res.status(statusCode).json(response);

    } catch (error) {
        console.error('Error creating tag(s):', error);
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

        const contactsWithTag = await Contact.find({ tags: tagId });

        if (contactsWithTag.length > 0) {
            return res.status(409).json({
                message: "Cannot delete tag that is in use by contacts",
                contactCount: contactsWithTag.length
            });
        }
        // else {
        //     return res.status(400).json({ error: 'No contacts found with this tag' });
        // }


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
