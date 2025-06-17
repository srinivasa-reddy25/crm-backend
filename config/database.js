console.log("database.js file is excecuted")

const mongoose = require('mongoose')

const MONGO_URL = process.env.MONGODB_URL || ''


if (!MONGO_URL) {
    throw new Error("Db url is not there")
}


const connectToDataBase = async () => {
    console.log("connecting to DataBase.........")
    try {
        await mongoose.connect(MONGO_URL)
    }
    catch (err) {
        return console.log("error", err)
    }
    console.log("excecuted the connectToDataBase successfully")
}



module.exports = connectToDataBase;
