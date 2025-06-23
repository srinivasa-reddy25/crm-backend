const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv')

dotenv.config()

const connectToDataBase = require('./config/database')

const authRouters = require("./routes/auth")
const contactRouters = require("./routes/contact")
const CompanyRouter = require("./routes/company")
const TagRouter = require("./routes/tag")
const dashboardRouter = require("./routes/dashboard")


const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());

app.use('/api/activities', require('./routes/activityRoutes'));


app.use("/api", authRouters)
app.use("/api/contacts", contactRouters)
app.use("/api/companies", CompanyRouter)
app.use("/api/tags", TagRouter)
app.use("/api/dashboard", dashboardRouter)


const PORT = process.env.PORT




process.on('SIGINT', () => {
    console.log('Received SIGINT. Graceful shutdown...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    process.exit(0);
});






app.listen(PORT, async () => {
    console.log(`Server starting on port ${PORT}...`);

    try {
        await connectToDataBase();
        console.log('Connected to database successfully');
        console.log(`Server running at http://localhost:${PORT}`);
    } catch (error) {
        console.error(' Failed to connect to database:', error);
        process.exit(1);
    }

})

