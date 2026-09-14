const admin = require('../config/firebase');

async function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ') || !header.slice(7).trim()) {
        return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Please sign in to continue.' });
    }
    try {
        const token = await admin.auth().verifyIdToken(header.slice(7), true);
        if (!token.email || !token.email_verified) {
            return res.status(403).json({ code: 'EMAIL_NOT_VERIFIED', error: 'Verify your email before continuing.' });
        }
        req.user = {
            uid: token.uid, id: token.uid, email: token.email,
            emailVerified: token.email_verified, name: token.name, picture: token.picture,
        };
        return next();
    } catch {
        return res.status(401).json({ code: 'AUTH_EXPIRED', error: 'Your session expired. Please sign in again.' });
    }
}
module.exports = authenticate;
