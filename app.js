import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import db from './config/db.js';
import { protect } from './middlewares/authMiddleware.js';

dotenv.config();


const app = express();

db();
app.use(express.json());

// Sample route
app.get('/', (req, res) => { 
    res.json({ "success": true }); 
});

// Expose multiple API keys via a single route
app.get('/api/config/keys',protect, (req, res) => {
    res.json({
        youtubeApiKey: process.env.YOUTUBE_API_KEY,
    });
});


// User and Admin Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Handle unhandled routes
app.use((req, res, next) => {
    res.status(404).json({ message: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error '+err.stack });
});

export default app;
