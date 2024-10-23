import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pay from './routes/payment.js';
import db from './config/db.js';
import { protect } from './middlewares/authMiddleware.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();


const app = express();

db();
app.use(express.json());
const allowedOrigins = [
    'https://musical-rotary-phone-g47x75gr6g4w395rw-3000.app.github.dev',
    'https://your-production-domain.com',
    // Add more origins as needed
  ];
  
  app.use(cors({
    origin: function(origin, callback){
      // Allow requests with no origin (like mobile apps, curl requests)
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // Allow cookies and authentication headers
    exposedHeaders: ['Content-Range'], // Expose specific headers
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'], // Allow specific headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Allow specific HTTP methods
  }));



// Use cookie-parser middleware
app.use(cookieParser());

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
app.use('/api/payments', pay)
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
