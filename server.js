const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const router = require('./routes/index.route');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mydatabase';
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    console.log('Health check endpoint hit');
    res.status(200).json({ message: 'Server is healthy' });
});

app.use('/api/', router);

// Connect to MongoDB and start server only after connection is established
const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Import notification utility after MongoDB connection is established
        require('./utils/notification.util');
        console.log('Notification utility loaded');
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

startServer();