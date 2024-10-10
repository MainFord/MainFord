import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../config/jwtConfig.js';
import { sendEmail } from '../config/nodemailer.js';
import cloudinary from '../config/cloudinary.js';
import { generateReferralCode } from '../utils/referralCode.js';
import { emailVerificationTemplate } from '../utils/emailTemplates.js';
import { generateMemorablePassword } from '../utils/passwod.js';
import { encrypt } from '../utils/encryptUtils.js'

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
    await newUser.save();
    const password = generateMemorablePassword(newUser.name);

     // Hash the password before saving it to the database
    //  newUser.password = await bcrypt.hash(password, 12);
    newUser.password = await bcrypt.hash(phone, 12);;

     await newUser.save();
 
    //  // Send an email with the username and password
    //  await sendEmail(
    //    newUser.email,
    //    'Welcome to Our Platform - Your Login Details',
    //    `<p>Dear ${newUser.name},</p>
    //    <p>Welcome to our platform! Here are your login details:</p>
    //    <p><strong>Email:</strong> ${newUser.email}</p>
    //    <p><strong>Password:</strong> ${password}</p>
    //    <p>Please log in and change your password as soon as possible.</p>
    //    <p>Best regards,</p>
    //    <p>The Team</p>`
    //  );

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

    // if (!user.emailVerified) return res.status(400).json({ message: 'Please verify your email' });
    
    // if (!user.adminApproved) return res.status(403).json({ message: 'Admin approval required' });

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
    courses: user.courses,
    images: user.images,
    accountDetails: user.accountDetails
  });
};

export const checkAdminApprove = async (req,res) => {
  const user = req.user ;
  const isApproved = user.adminApproved;
  res.json({ isApproved })
};

// Controller function to update user data
export const updateUserData = async (req, res) => {
  const user = req.user; // Assuming the user is authenticated and the middleware has set req.user
  const { name, email, phone, dob, accountDetails, photoUrl, password, adminApproved } = req.body;

  try {
    // Update the user fields if they exist in the request body
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (dob) user.dob = dob;
    if (photoUrl) user.photoUrl = photoUrl;
    if (adminApproved) user.adminApproved = adminApproved;

    // Update account details if provided
    if (accountDetails) {
      const { accountNumber, ifsc, holderName } = accountDetails;
      if (accountNumber) user.accountDetails.accountNumber = encrypt(accountNumber);
      if (ifsc) user.accountDetails.ifsc = encrypt(ifsc);
      if (holderName) user.accountDetails.holderName = encrypt(holderName);
    }

    // Update password if provided (hash it before saving)
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      user.password = hashedPassword;
    }

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};