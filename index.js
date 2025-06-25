const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv')
const http = require('http');
const mongoose = require('mongoose');



dotenv.config()
const connectToDataBase = require('./config/database')
const setupSocketIO = require('./sockets/chatHandlers');

const authRouters = require("./routes/auth")
const contactRouters = require("./routes/contact")
const CompanyRouter = require("./routes/company")
const TagRouter = require("./routes/tag")
const dashboardRouter = require("./routes/dashboard")
const conversationRoutes = require('./routes/conversationRoutes');



const app = express();
const server = http.createServer(app);
const io = setupSocketIO(server);



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
app.use('/api/conversations', conversationRoutes);

app.get('/', (req, res) => {
    res.send('CRM Backend API is running ✅');
});


process.on('SIGINT', async () => {
    console.log('Received SIGINT. Graceful shutdown...');
    try {
        io.close(() => console.log('Socket.IO closed'));

        server.close(() => console.log('HTTP server closed'))

        await mongoose.disconnect();
        console.log('Database disconnected');

        process.exit(0);
    } catch (err) {

        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Graceful shutdown...');
    process.exit(0);
});


const PORT = process.env.PORT

server.listen(PORT, async () => {
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

