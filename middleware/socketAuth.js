const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const User = require('../models/User'); // Adjust the path as necessary


async function socketAuthMiddleware(socket, next) {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('Firebase token missing'));
    }



    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = await User.findOne({ firebaseUID: decodedToken.uid });
        if (!user) {
            return next(new Error('User not found'));
        }

        const userId = user._id;

        socket.user = {
            uid: userId,
            email: decodedToken.email,
            name: decodedToken.name || '',
            picture: decodedToken.picture || ''
        };
        next();
    } catch (error) {
        console.error('Firebase token verification failed:', error.message);
        next(new Error('Unauthorized'));
    }
}

module.exports = socketAuthMiddleware;