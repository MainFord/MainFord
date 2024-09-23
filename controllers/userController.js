import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../config/jwtConfig.js';
import { sendEmail } from '../config/nodemailer.js';
import cloudinary from '../config/cloudinary.js';
import { generateReferralCode } from '../utils/referralCode.js';
import { emailVerificationTemplate } from '../utils/emailTemplates.js';

export const registerUser = async (req, res) => {
  console.log("Register User API called with body:", req.body);
  const { name, email, phone, dob, referredBy, paymentUrlOfReg } = req.body;

  console.time("Total Register User Operation");

  try {
    console.time("Check if User Exists");
    const userExists = await User.findOne({ email });
    console.timeEnd("Check if User Exists");

    if (userExists) {
      console.log("User already exists:", email);
      console.timeEnd("Total Register User Operation");
      return res.status(400).json({ message: 'User already exists' });
    }

    const referralCode = generateReferralCode();
    console.log("Generated referral code:", referralCode);

    console.time("Create New User");
    const newUser = await User.create({
      name,
      email,
      phone,
      dob,
      referredBy,
      referralCode,
      paymentUrlOfReg,
      adminApproved: false,
    });
    console.timeEnd("Create New User");

    console.log("New user created:", newUser);

    // Optionally send verification email (commented out)
    // const emailToken = generateReferralCode(); // Random token for verification
    // newUser.emailVerificationToken = emailToken;
    // await newUser.save();

    console.time("Save New User");
    await newUser.save();
    console.timeEnd("Save New User");

    const token = generateToken(newUser._id);
    console.log("Generated JWT token for user:", newUser._id);

    console.timeEnd("Total Register User Operation");
    res.status(201).json({ newUser, token });
  } catch (error) {
    console.error("Error in registerUser:", error);
    console.timeEnd("Total Register User Operation");
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
