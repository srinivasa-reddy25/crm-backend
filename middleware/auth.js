const admin = require("../config/firebase")



const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;



        // console.log("Auth Header : ", authHeader)

        // console.log("Auth Header : ", authHeader)
        // console.log(!authHeader.startsWith("Bearer "))

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("No Authorization Header Found")
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // const token=req.body.token || req.query.token;
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }
        // const token = authHeader.split(" ")[1]

        const decodedToken = await admin.auth().verifyIdToken(token);
        // console.log("Decoded Token : ", decodedToken)

        req.user = {
            uid: decodedToken.uid,
            id: decodedToken.uid,
            email: decodedToken.email
        }
        next();

    } catch (err) {
        console.log("Authentication Error : ", err)
        res.status(401).json({
            error: 'Unauthorized: No token provided'
        })
    }
}


module.exports = authenticate;
