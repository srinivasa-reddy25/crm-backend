const User = require('../models/User');
const { Activity } = require('../models/Activities');

// Only verified Firebase identities reach this service. Retrying a partially
// completed registration must recover the same CRM account, not create another.
async function syncAuthAccount(identity, metadata = {}, { recordLogin = true } = {}) {
    if (!identity.emailVerified || !identity.email) {
        throw Object.assign(new Error('Verify your email before continuing.'), { status: 403, code: 'EMAIL_NOT_VERIFIED' });
    }
    let user = await User.findOne({ firebaseUID: identity.uid });
    let isNewUser = false;
    if (!user) {
        user = await User.findOne({ email: identity.email });
        if (user) {
            user.firebaseUID = identity.uid;
            await user.save();
        } else {
            try {
                user = await User.create({
                    firebaseUID: identity.uid,
                    email: identity.email,
                    displayName: identity.name || metadata.name || identity.email.split('@')[0],
                    profilePicture: identity.picture || '',
                    preference: 'light',
                });
                isNewUser = true;
            } catch (error) {
                if (error.code !== 11000) throw error;
                user = await User.findOne({ firebaseUID: identity.uid });
                if (!user) throw error;
            }
        }
    }
    // Analytics must never turn a successful authentication into a failed login.
    if (isNewUser || recordLogin) await Activity.create({
        user: user._id,
        action: isNewUser ? 'user_register' : 'user_login',
        entityType: 'user', entityId: user._id,
        entityName: user.displayName || user.email,
        details: { email: user.email },
    }).catch(() => console.error('Could not record authentication activity'));
    return { user, isNewUser };
}
module.exports = { syncAuthAccount };
