// routes/adminRoutes.js

import express from 'express';
import {
  adminLogin,
  adminLogout,
  updateWithdrawalStatus,
  approveUser,
  getAllUsers,
  getUserById,
  deleteUser,
  updateUserDetails,
  getAllPayments,
  getPaymentById,
  deletePayment,
  updatePaymentDetails
} from '../controllers/adminController.js';
import { adminAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', adminLogin);

/**
 * @route   POST /admin/logout
 * @desc    Admin logout
 * @access  Protected
 */
router.post('/logout', adminAuth, adminLogout);

/**
 * @route   PUT /admin/withdrawal-status
 * @desc    Approve or reject withdrawal requests
 * @access  Protected
 */
router.put('/withdrawal-status', adminAuth, updateWithdrawalStatus);

/**
 * @route   PUT /admin/approve-user
 * @desc    Approve a user
 * @access  Protected
 */
router.put('/approve-user', adminAuth, approveUser);

/**
 * @route   GET /admin/users
 * @desc    Get all users
 * @access  Protected
 */
router.get('/users', adminAuth, getAllUsers);

/**
 * @route   GET /admin/users/:userId
 * @desc    Get user by ID
 * @access  Protected
 */
router.get('/users/:userId', adminAuth, getUserById);

/**
 * @route   DELETE /admin/users/:userId
 * @desc    Delete user by ID
 * @access  Protected
 */
router.delete('/users/:userId', adminAuth, deleteUser);

/**
 * @route   PUT /admin/users/:userId
 * @desc    Update user details by ID
 * @access  Protected
 */
router.put('/users/:userId', adminAuth, updateUserDetails);

/**
 * @route   GET /admin/payments
 * @desc    Get all payments
 * @access  Protected
 */
router.get('/payments', adminAuth, getAllPayments);

/**
 * @route   GET /admin/payments/:paymentId
 * @desc    Get payment by ID
 * @access  Protected
 */
router.get('/payments/:paymentId', adminAuth, getPaymentById);

/**
 * @route   DELETE /admin/payments/:paymentId
 * @desc    Delete payment by ID
 * @access  Protected
 */
router.delete('/payments/:paymentId', adminAuth, deletePayment);

/**
 * @route   PUT /admin/payments/:paymentId
 * @desc    Update payment details by ID
 * @access  Protected
 */
router.put('/payments/:paymentId', adminAuth, updatePaymentDetails);

/**
 * Additional admin routes can be added here following the same pattern.
 */

export default router;
