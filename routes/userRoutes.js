import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/userController.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';
import { protect } from '../middlewares/authMiddleware.js';

// Configure Cloudinary
cloudinary.config({
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

router.post('/register', upload.single('photo'), registerUser); // User registration with photo
router.post('/login', loginUser); // User login
router.get('/profile', protect, getUserProfile); // Get user profile with token-based auth

export default router;
