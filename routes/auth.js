const express = require('express');
const authenticate = require("../middleware/auth")
const User = require("../models/User")

const { Activity } = require("../models/Activities")
const router = express.Router()



const { syncAuthAccount } = require('../services/authAccount');

const completeAuth = async (req, res) => {
    try {
        const result = await syncAuthAccount(req.user, req.body, { recordLogin: req.path !== "/auth/session" });
        return res.status(result.isNewUser ? 201 : 200).json({
            message: result.isNewUser ? 'Account created successfully' : 'Login successful',
            ...result,
        });
    } catch (error) {
        console.error('Account synchronization failed:', error.code || 'server-error');
        return res.status(error.status || 500).json({
            code: error.code === 'EMAIL_NOT_VERIFIED' ? error.code : 'ACCOUNT_SYNC_FAILED',
            error: error.status ? error.message : 'Could not finish signing in. Please try again.',
        });
    }
};

const getprofilefunction = async (req, res) => {
    const { uid, email } = req.user

    try {
        const user = await User.findOne({ firebaseUID: uid });

        if (!user) {
            return res.status(404).json({
                error: "Error occured in the DataBase"
            })
        }
        res.status(200).json({
            response: "ok",
            user
        });

    } catch (err) {
        res.status(500).json({
            error: "Error occured in the DataBase"
        });
    }
}

const updateprofilefunction = async (req, res) => {
    const { uid, email } = req.user
    const { displayName, profilePicture } = req.body
    try {
        const user = await User.findOne({ firebaseUID: uid });

        if (!user) {
            return res.status(404).json({
                error: "Error occured in the DataBase"
            })
        }

        const updateduser = await User.findOneAndUpdate({ firebaseUID: uid },
            { $set: { displayName, profilePicture } },
            { new: true }
        )

        if (!updateduser) {
            return res.status(404).json({
                error: "User not found in the database"
            });
        }


        res.status(200).json({
            response: "ok",
            updateduser,
            message: "Updated the user data successfully"
        });

    } catch (err) {
        res.status(500).json({
            error: "Error occured in the DataBase"
        });
    }

}

router.post("/auth/register", authenticate, completeAuth)
router.post("/auth/login", authenticate, completeAuth)
router.post("/auth/session", authenticate, completeAuth)
router.post("/auth/google", authenticate, completeAuth);

router.get("/auth/profile", authenticate, getprofilefunction)
router.put("/auth/profile", authenticate, updateprofilefunction)



module.exports = router;
