import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../config/jwtConfig.js';
import { sendEmail } from '../config/nodemailer.js';
import cloudinary from '../config/cloudinary.js';
import { generateReferralCode } from '../utils/referralCode.js';
import { emailVerificationTemplate } from '../utils/emailTemplates.js';

export const registerUser = async (req, res) => {
  const { name, email, phone, dob, referredBy } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Check if file was uploaded
    if (!req.file) return res.status(400).json({ message: 'Photo upload is required' });

    // The upload to Cloudinary is handled by Multer, so you can access the secure URL directly from req.file
    const paymentUrlOfReg = req.file.path; // req.file.path already has the secure URL from Cloudinary

    const referralCode = generateReferralCode();

    const newUser = await User.create({
      name,
      email,
      phone,
      dob,
      referredBy,
      referralCode,
      paymentUrlOfReg, // Use the URL directly from the file
      adminApproved: false,
    });

   
    await newUser.save();

    const token = generateToken(newUser._id);

    res.status(201).json({ newUser, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Login function with JWT token
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    if (!user.emailVerified) return res.status(400).json({ message: 'Please verify your email' });
    
    if (!user.adminApproved) return res.status(403).json({ message: 'Admin approval required' });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get authenticated user profile
export const getUserProfile = async (req, res) => {
  const user = req.user;  // User is attached from the protect middleware

  res.status(200).json({
    name: user.name,
    email: user.email,
    phone: user.phone,
    dob: user.dob,
    referralCode: user.referralCode,
    paymentHistory: user.paymentHistory,
    adminApproved: user.adminApproved,
    photoUrl: user.photoUrl,
  });
};
