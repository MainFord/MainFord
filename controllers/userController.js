import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../config/jwtConfig.js';
import { sendEmail } from '../config/nodemailer.js';
import cloudinary from '../config/cloudinary.js';
import { generateReferralCode } from '../utils/referralCode.js';
import { emailVerificationTemplate } from '../utils/emailTemplates.js';

// Register user with JWT token generation
export const registerUser = async (req, res) => {
  const { name, email, phone, dob, referredBy, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload photo to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    const referralCode = generateReferralCode();

    const newUser = await User.create({
      name,
      email,
      phone,
      dob,
      referredBy,
      password: hashedPassword,
      referralCode,
      photoUrl: result.secure_url,
      adminApproved: false,
    });

    // Send verification email (asynchronous)
    const emailToken = generateReferralCode(); // Random token for verification
    newUser.emailVerificationToken = emailToken;
    await newUser.save();

    const emailHtml = emailVerificationTemplate(emailToken);
    await sendEmail(email, 'Verify Your Email', emailHtml);

    // Generate JWT token
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
