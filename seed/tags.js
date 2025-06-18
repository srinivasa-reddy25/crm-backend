require('dotenv').config();
const mongoose = require('mongoose');
const { Tag } = require('../models/Tags');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/crm-app';

const firebaseUID = 'j5GbsdpOfpfQxHJGGjn2fl9nLqj1';
const ObjectId = mongoose.Types.ObjectId;
const fallbackUserId = new ObjectId();

const getUserId = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for user lookup');

    const user = await User.findOne({ firebaseUID });

    if (user) {
      console.log('Found user with ID:', user._id);
      return user._id;
    } else {
      console.log('User not found, using fallback ID');
      return fallbackUserId;
    }
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return fallbackUserId;
  }
};

async function seedTags() {
  try {
    const userId = await getUserId();

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB');
    }

    const tags = [
      {
        name: 'VIP',
        color: 'red',
        createdBy: userId,
        usageCount: 0,
      },
      {
        name: 'Follow-Up',
        color: 'yellow',
        createdBy: userId,
        usageCount: 0,
      },
      {
        name: 'Prospect',
        color: 'blue',
        createdBy: userId,
        usageCount: 0,
      },
      {
        name: 'Partner',
        color: 'green',
        createdBy: userId,
        usageCount: 0,
      },
      {
        name: 'Demo Done',
        color: 'purple',
        createdBy: userId,
        usageCount: 0,
      },
    ];

    await Tag.deleteMany(); // Optional cleanup
    await Tag.insertMany(tags);

    console.log('🏷️ Tag data seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedTags();
