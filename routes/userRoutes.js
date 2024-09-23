import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/userController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import { protect } from '../middlewares/authMiddleware.js';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // The name of the folder in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'], // Allowed file formats
  },
});

const upload = multer({ storage: storage }); // Use the configured storage

const router = express.Router();

// Middleware for logging requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.originalUrl}`);
  next();
});

// User registration with photo
router.post('/register', upload.single('screenshot'), async (req, res) => {
  console.log("Image upload result:", req.file); // Log the uploaded file details
  await registerUser(req, res);
});

// User login
router.post('/login', async (req, res) => {
  console.log("Login attempt with email:", req.body.email);
  await loginUser(req, res);
});

// Get user profile with token-based auth
router.get('/profile', protect, async (req, res) => {
  console.log("User profile request for user ID:", req.user._id);
  await getUserProfile(req, res);
});

export default router;
