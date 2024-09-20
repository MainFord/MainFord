import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/userController.js';
import multer from 'multer';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Multer for handling file uploads

router.post('/register', upload.single('photo'), registerUser);  // User registration with photo
router.post('/login', loginUser);  // User login
router.get('/profile', protect, getUserProfile);  // Get user profile with token-based auth

export default router;
