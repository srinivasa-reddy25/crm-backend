const mongoose = require("mongoose")


const UserSchema = mongoose.Schema({
    firebaseUID: { type: String, required: true, unique: true },
    displayName: { type: String },
    email: { type: String, unique: true },
    profilePicture: { type: String },
    preference: { type: String },
    lastLogin: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})


UserSchema.methods.updateLastLogin = function () {
    this.lastLogin = new Date();
    return this.save();
};





const User = mongoose.models.User || mongoose.model("User", UserSchema)

module.exports = User