const express = require('express');
const authenticate = require("../middleware/auth")
const User = require("../models/User")

const { Activity } = require("../models/Activities")
const router = express.Router()



const registerFunction = async (req, res) => {
    const { uid, email } = req.user

    const { name, profilePicture, preference } = req.body

    // console.log("User details from middleware: ", req.user)

    const prevuser = await User.findOne({ email })

    if (prevuser) {
        return res.status(409).json({
            error: "The User already exists"
        })
    }
    // return res.status(200).json({
    //     message: "User does not exist, creating a new user",
    //     uid, email, name
    // })


    const user = new User({
        firebaseUID: uid,
        displayName: name,
        email: email,
        profilePicture,
        preference
    })




    const saveUser = await user.save();
    res.status(200).json({
        message: "Successfully created the user",
        saveUser
    })
}


const loginFunction = async (req, res) => {

    const { uid, email } = req.user

    try {
        const user = await User.findOne({ firebaseUID: uid });

        if (!user) {
            return res.status(404).json({
                error: "User not found. Please register first."
            })
        }

        await Activity.create({
            user: user._id,
            action: "user_login",
            entityType: "user",
            entityId: user._id,
            entityName: user.displayName || user.email,
            details: {
                email: user.email
            }
        });

        res.status(200).json({
            message: 'Login successful',
            user
        });

    } catch (err) {
        console.log("login failed", err)
        res.status(500).json({
            error: "Login failed"
        });
    }

}


const handleGoogleAuth = async (req, res) => {
    const { uid, email } = req.user

    const { name, profilePicture, preference } = req.body

    try {

        let user = await User.findOne({ firebaseUID: uid });

        if (!user) {
            console.log("New Google user, creating account");
            user = new User({
                firebaseUID: uid,
                displayName: name,
                email: email,
                profilePicture: profilePicture || '',
                preference: 'light',
            });

            await user.save();

            await Activity.create({
                user: user._id,
                action: "user_register",
                entityType: "user",
                entityId: user._id,
                entityName: user.displayName || user.email,
                details: {
                    email: user.email
                }
            });

            return res.status(201).json({
                message: 'Google user registered successfully',
                user,
                isNewUser: true
            });
        }

        await Activity.create({
            user: user._id,
            action: "user_login",
            entityType: "user",
            entityId: user._id,
            entityName: user.displayName || user.email,
            details: {
                email: user.email
            }
        });




        return res.status(200).json({
            message: 'Google login successful',
            user,
            isNewUser: false
        });

    } catch (err) {
        console.error("Google auth error:", err);
        return res.status(500).json({
            error: "Authentication failed"
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

router.post("/auth/register", authenticate, registerFunction)
router.post("/auth/login", authenticate, loginFunction)
router.post("/auth/google", authenticate, handleGoogleAuth);

router.get("/auth/profile", authenticate, getprofilefunction)
router.put("/auth/profile", authenticate, updateprofilefunction)



module.exports = router;
