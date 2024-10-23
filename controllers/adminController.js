// controllers/adminController.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

/**
 * Admin Login Controller
 */
export const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const adminUsername = process.env.ADMIN_USER;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (username !== adminUsername) {
      return res.status(403).json({ message: 'Invalid admin credentials.' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isPasswordValid) {
      return res.status(403).json({ message: 'Invalid admin credentials.' });
    }

    // Create JWT payload
    const payload = {
      username: adminUsername,
      role: 'admin'
    };

    // Sign the JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set the JWT in an HTTP-only cookie
    res.cookie(process.env.COOKIE_NAME, token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Ensures the browser only sends the cookie over HTTPS
      sameSite: 'none', // Protects against CSRF
      maxAge: parseInt(process.env.COOKIE_MAX_AGE) // Cookie expiration in milliseconds
    });

    res.status(200).json({ message: 'Admin logged in successfully.' });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Admin Logout Controller
 */
export const adminLogout = (req, res) => {
  res.clearCookie(process.env.COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ message: 'Logged out successfully.' });
};

/**
 * Approve or Reject Withdrawal Requests
 */
export const updateWithdrawalStatus = async (req, res) => {
  const { paymentId, status } = req.body;

  if (!paymentId || !status) {
    return res.status(400).json({ message: 'Payment ID and status are required.' });
  }

  try {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    ).populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Update Withdrawal Status Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Approve User
 */
export const approveUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { adminApproved: true },
      { new: true }
    )
      .populate('referredBy', 'name email')
      .populate('paymentHistory')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Approve User Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get All Users
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('referredBy', 'name email')
      .populate('paymentHistory')
      .select('-password'); // Exclude password from the response

    res.status(200).json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get User by ID
 */
export const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId)
      .populate('referredBy', 'name email')
      .populate('paymentHistory')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Get User by ID Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Delete User
 */
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Optionally, handle cascading deletions or data archiving here.

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update User Details
 */
export const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body; // Ensure to validate and sanitize this data as needed

  try {
    // Prevent updating certain fields like password directly
    const forbiddenFields = ['password', 'adminApproved', 'paymentHistory', 'courses', 'images'];
    forbiddenFields.forEach(field => delete updateData[field]);

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .populate('referredBy', 'name email')
      .populate('paymentHistory')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Update User Details Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get All Payments
 */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email') // Populate user details
      .sort({ requestDate: -1 }); // Sort by most recent

    res.status(200).json(payments);
  } catch (error) {
    console.error('Get All Payments Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Payment by ID
 */
export const getPaymentById = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId)
      .populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Get Payment by ID Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Delete Payment
 */
export const deletePayment = async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findByIdAndDelete(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.status(200).json({ message: 'Payment deleted successfully.' });
  } catch (error) {
    console.error('Delete Payment Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update Payment Details
 */
export const updatePaymentDetails = async (req, res) => {
  const { paymentId } = req.params;
  const updateData = req.body; // Ensure to validate and sanitize this data as needed

  try {
    // Restrict which fields can be updated
    const allowedFields = ['status', 'amount', 'type'];
    const filteredData = {};

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const payment = await Payment.findByIdAndUpdate(paymentId, filteredData, { new: true })
      .populate('userId', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.status(200).json(payment);
  } catch (error) {
    console.error('Update Payment Details Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
