// controllers/adminController.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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

    res.status(200).json({ message: 'Admin logged in successfully.', token });
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
    // Extract query parameters with default values
    const { filter = '{}', range = '[0,9]', sort = '["id","ASC"]' } = req.query;

    // Parse JSON strings into objects/arrays
    const parsedFilter = JSON.parse(filter);
    const parsedRange = JSON.parse(range);
    const parsedSort = JSON.parse(sort);

    // Determine pagination values
    const [start, end] = parsedRange;
    const limit = end - start + 1;
    const skip = start;

    // Determine sorting
    const [sortField, sortOrder] = parsedSort;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder === 'ASC' ? 1 : -1;

    // Query the database with filters, sorting, and pagination
    const usersPromise = User.find(parsedFilter)
      .select('name email adminApproved referralCode paymentUrlOfReg') // Exclude password from the response
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count for pagination
    const countPromise = User.countDocuments(parsedFilter).exec();

    // Execute both promises in parallel
    const [users, total] = await Promise.all([usersPromise, countPromise]);

    // Set the Content-Range header for frontend (optional, but good practice)
    res.setHeader('Content-Range', `users ${start}-${end}/${total}`);

    // Respond with the data in the format expected by React Admin
    res.status(200).json({data:users,success:true, total})
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
    const forbiddenFields = ['password'];
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
    // Extract query parameters with default values
    const { filter = '{}', range = '[0,9]', sort = '["requestDate","DESC"]' } = req.query;

    // Parse JSON strings into objects/arrays
    const parsedFilter = JSON.parse(filter);
    const parsedRange = JSON.parse(range);
    const parsedSort = JSON.parse(sort);

    // Validate parsedRange
    if (!Array.isArray(parsedRange) || parsedRange.length !== 2) {
      return res.status(400).json({ message: 'Invalid range parameter. Expected format: [start, end]' });
    }

    // Validate parsedSort
    if (!Array.isArray(parsedSort) || parsedSort.length !== 2) {
      return res.status(400).json({ message: 'Invalid sort parameter. Expected format: ["field", "order"]' });
    }

    const [start, end] = parsedRange;
    const limit = end - start + 1;
    const skip = start;

    const [sortField, sortOrder] = parsedSort;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;

    // Query the database with filters, sorting, and pagination
    const paymentsPromise = Payment.find(parsedFilter)
      .populate('userId', 'name email') // Populate user details
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    // Get total count for pagination
    const countPromise = Payment.countDocuments(parsedFilter).exec();

    // Execute both promises in parallel
    const [payments, total] = await Promise.all([paymentsPromise, countPromise]);

    // Respond with the data and total count
    res.status(200).json({ data: payments, total });
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


// controllers/adminController.js
/**
 * Get User Referrals (Referral Chain)
 */
export const getUserReferrals = async (req, res) => {
  const { userId } = req.params;

  // Validate the userId
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Valid User ID is required.' });
  }

  try {
    const user = await User.findById(userId)
      .select('name email referralCode')
      .lean(); // Use lean() for plain JavaScript objects

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Aggregation pipeline to fetch referral chain
    const referrals = await User.aggregate([
      {
        // Match the root user
        $match: { _id: new mongoose.Types.ObjectId(userId) }, // Added 'new' keyword
      },
      {
        // Use $graphLookup to recursively find referred users
        $graphLookup: {
          from: 'users', // Collection name in MongoDB (usually the plural of the model name)
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'referredBy',
          as: 'referralChain',
          depthField: 'referralLevel', // Optional: To indicate the level of referral
          maxDepth: 5, // Optional: Limit the recursion to 5 levels
        },
      },
      {
        // Optionally, project only necessary fields
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          referralCode: 1,
          referralChain: {
            _id: 1,
            name: 1,
            email: 1,
            referralCode: 1,
            referralLevel: 1, // If depthField is used
          },
        },
      },
    ]);

    if (!referrals || referrals.length === 0) {
      return res.status(200).json({
        user,
        referrals: [],
      });
    }

    // Sort referrals by referralLevel if needed
    referrals[0].referralChain.sort((a, b) => a.referralLevel - b.referralLevel);
    const referralTree = buildReferralTree(user, referrals[0].referralChain);
    res.status(200).json({
      user,
      referralTree,
    });
  } catch (error) {
    console.error('Get User Referrals Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Utility function to build a tree from flat referrals
 */
const buildReferralTree = (user, referrals) => {
  const userMap = {};

  // Initialize the root user in the map
  userMap[user._id.toString()] = { ...user, referrals: [] };
  console.log('stage 1'+userMap)

  // Iterate through referrals and build the map
  referrals.forEach(ref => {
    userMap[ref._id.toString()] = { ...ref, referrals: [] };
  });
  console.log('stage 2'+userMap)
  // Link referrals to their referrers
  referrals.forEach(ref => {
    if (ref.referredBy) {
      const referrer = userMap[ref.referredBy.toString()];
      if (referrer) {
        referrer.referrals.push(userMap[ref._id.toString()]);
      }
    }
  });
  console.log('stage 3'+userMap)

  return userMap;
};


