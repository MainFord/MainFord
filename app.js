import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import db from './config/db.js';

dotenv.config();


const app = express();

db();
app.use(express.json());

// Sample route
app.get('/', (req, res) => { 
    res.json({ "success": true }); 
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
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error '+err.stack });
});

export default app;
