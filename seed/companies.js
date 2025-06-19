require('dotenv').config();
const mongoose = require('mongoose');
const { Company } = require('../models/Company');
const User = require('../models/User'); // Import the User model

const MONGO_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/crm-app';

const firebaseUID = 'j5GbsdpOfpfQxHJGGjn2fl9nLqj1'; // Just use the UID part, not the full token

// Use ObjectId for a fallback dummy user if needed
const ObjectId = mongoose.Types.ObjectId;
const fallbackUserId = new ObjectId();

const getUserId = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for user lookup');

    // Now User model is properly loaded
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

async function seedCompanies() {
  try {
    // Get the user ID first
    const userId = await getUserId();

    // No need to connect again if already connected in getUserId
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(MONGO_URI);
      console.log('✅ Connected to MongoDB');
    }

    const companies = [
      {
        name: 'TechCorp',
        industry: 'Software',
        website: 'https://techcorp.com',
        address: '123 Tech Ave, San Francisco, CA',
        phone: '+1-800-555-TECH',
        email: 'info@techcorp.com',
        description: 'Leading software company specializing in cloud services.',
        createdBy: userId,
      },
      {
        name: 'HealthWave',
        industry: 'Healthcare',
        website: 'https://healthwave.io',
        address: '456 Wellness Blvd, Boston, MA',
        phone: '+1-800-555-HEAL',
        email: 'contact@healthwave.io',
        description: 'Healthcare innovation platform improving patient outcomes.',
        createdBy: userId,
      },
      {
        name: 'EduSmart',
        industry: 'Education',
        website: 'https://edusmart.org',
        address: '789 Learning Ln, Austin, TX',
        phone: '+1-800-555-EDU',
        email: 'hello@edusmart.org',
        description: 'Modern learning platform for digital education.',
        createdBy: userId,
      },
      {
        name: 'MarketGenius',
        industry: 'Marketing',
        website: 'https://marketgenius.ai',
        address: '321 Strategy St, New York, NY',
        phone: '+1-800-555-MKT',
        email: 'support@marketgenius.ai',
        description: 'AI-powered marketing analytics platform.',
        createdBy: userId,
      },
      {
        name: 'GreenLogix',
        industry: 'Sustainability',
        website: 'https://greenlogix.com',
        address: '654 Eco Dr, Seattle, WA',
        phone: '+1-800-555-GRN',
        email: 'info@greenlogix.com',
        description: 'Green energy logistics and consulting services.',
        createdBy: userId,
      },
    ];

    await Company.deleteMany(); // Optional: clean before inserting
    await Company.insertMany(companies);

    console.log('🏢 Company data seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedCompanies();
