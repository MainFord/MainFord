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

  // Check if the file is uploaded
  if (!req.file) {
    return res.status(400).json({ message: 'Payment screenshot is required.' });
  }

  const paymentUrlOfReg = req.file.path; // Set paymentUrlOfReg from the uploaded image URL

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let referrerId = null;

    // Check if referredBy exists
    if (referredBy) {
      const referrer = await User.findOne({ referralCode: referredBy });

      if (!referrer) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }

      // Set the referredBy field to the referrer's _id
      referrerId = referrer._id;
    }

    const referralCode = generateReferralCode();

    const newUser = await User.create({
      name,
      email,
      phone,
      dob,
      referredBy: referrerId, // Set to the referrer’s _id
      referralCode,
      paymentUrlOfReg,
      adminApproved: false,
    });

    // Optionally send verification email (commented out)
    // const emailToken = generateReferralCode(); // Random token for verification
    // newUser.emailVerificationToken = emailToken;
    // await newUser.save();

    const token = generateToken(newUser._id);
    res.status(201).json({ newUser, token });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(400).json({ message: error.message });
  }
};



export const getReferrals = async (req, res) => {
  const user = req.user;  // User is attached from the protect middleware

  try {
    // Find users referred by the authenticated user
    const referrals = await User.find({ referredBy: user._id }).select('name email');

    // Count the number of referrals
    const referralCount = referrals.length;

    res.status(200).json({
      referralCount,
      referrals, // List of referral details
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
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
    referredBy: user.referredBy,
    courses: user.courses
  });
};

export const checkAdminApprove = async (req,res) => {
  const user = req.user ;
  const isApproved = user.adminApproved;
  res.json({ isApproved })
};