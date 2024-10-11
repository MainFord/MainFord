import express from 'express';
import { 
  requestPaymentWithdrawal, 
  updatePaymentStatus, 
  getPaymentById, 
  getUserPaymentStatistics, 
  addBalanceToUser, 
  getRequestedPayments 
} from '../controllers/payment.js';
import { protect, adminAuth } from '../middlewares/authMiddleware.js'; // Assuming you have protect middleware for user and admin authentication

const router = express.Router();

// Middleware for logging requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} request to ${req.originalUrl}`);
  next();
});

// Route to request a payment withdrawal (User route)
router.post('/withdrawal', protect, async (req, res) => {
  console.log("User withdrawal request by user ID:", req.user._id);
  await requestPaymentWithdrawal(req, res);
});

// Route to add balance to a user's account (Admin route)
router.post('/add-balance', protect, adminAuth, async (req, res) => {
  console.log("Admin adding balance to user ID:", req.body.userId);
  await addBalanceToUser(req, res);
});

// Route to update payment status (Admin route)
router.put('/update-status/:paymentId', protect, adminAuth, async (req, res) => {
  console.log(`Admin updating status of payment ID: ${req.params.paymentId}`);
  await updatePaymentStatus(req, res);
});

// Route to get all requested payments for admin review (Admin route)
router.get('/requested', protect, adminAuth, async (req, res) => {
  console.log("Admin fetching all requested payments");
  await getRequestedPayments(req, res);
});

// Route to get all payments of a user (User route)
router.get('/user-payments', protect, async (req, res) => {
  console.log("Fetching payment history for user ID:", req.user._id);
  await getUserPaymentStatistics(req, res);
});


// Route to get a specific payment by ID (User/Admin route)
router.get('/:paymentId', protect, async (req, res) => {
  console.log("Fetching payment details for payment ID:", req.params.paymentId);
  await getPaymentById(req, res);
});

export default router;
