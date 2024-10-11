import Payment from '../models/Payment.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import moment from 'moment'; // Moment.js for time-based calculations

// Controller function to handle payment withdrawal request
export const requestPaymentWithdrawal = async (req, res) => {
  const user = req.user; // Assuming the user is authenticated
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount specified.' });
  }

  try {
    // Check if user has sufficient balance (assuming balance is stored in the User schema)
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance for withdrawal.' });
    }

    // Create a new payment request with 'requested' status
    const payment = await Payment.create({
      userId: user._id,
      type: 'withdrawal',
      amount,
      status: 'requested', // Status is 'requested' at this point
    });

    res.status(201).json({ message: 'Withdrawal request submitted successfully and is now requested for approval.', payment });
  } catch (error) {
    console.error('Error in requestPaymentWithdrawal:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin controller function to update payment status and update user balance accordingly
export const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status, rejectionReason } = req.body;

  // Validate status value
  const validStatuses = ['completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value. Use "completed" or "rejected".' });
  }

  try {
    // Find the payment request by ID
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment request not found.' });
    }

    const user = await User.findById(payment.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (status === 'rejected') {
      if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required for rejected status.' });
      }
      payment.rejectionReason = rejectionReason;
      payment.status = 'rejected';

      // No changes to user balance since the withdrawal was not completed
    } else if (status === 'completed') {
      // Handle successful withdrawal: Decrease the user's balance only when the withdrawal is completed
      if (payment.type === 'withdrawal') {
        if (user.balance < payment.amount) {
          return res.status(400).json({ message: 'Insufficient balance for withdrawal completion.' });
        }
        user.balance -= payment.amount; // Deduct the balance for successful withdrawal
      }

      // Handle successful deposit: Increment user balance
      if (payment.type === 'deposit') {
        user.balance += payment.amount; // Increment balance for successful deposit
      }

      payment.status = 'completed';
    }

    // Save the updated user balance and payment status
    await user.save();
    await payment.save();

    res.status(200).json({ message: `Payment status updated to ${status}.`, payment });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to handle admin adding balance to a user's account
export const addBalanceToUser = async (req, res) => {
  const { userId, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount specified.' });
  }

  try {
    // Find the user by ID and increment the balance
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.balance += amount;

    // Save the new balance to the user document
    await user.save();

    // Create a new payment entry of type 'deposit' with status 'completed'
    const payment = await Payment.create({
      userId: user._id,
      type: 'deposit',
      amount,
      status: 'completed',
    });

    res.status(201).json({ message: 'Balance added successfully.', user, payment });
  } catch (error) {
    console.error('Error in addBalanceToUser:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get all requested payments for admin review
export const getRequestedPayments = async (req, res) => {
  try {
    // Fetch all payments with status 'requested'
    const requestedPayments = await Payment.find({ status: 'requested' }).populate('userId', 'name email');

    res.status(200).json({ requestedPayments });
  } catch (error) {
    console.error('Error fetching requested payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get a specific payment request by ID
export const getPaymentById = async (req, res) => {
  const { paymentId } = req.params;

  try {
    // Find the payment request by ID
    const payment = await Payment.findById(paymentId).populate('userId', 'name email');
    if (!payment) {
      return res.status(404).json({ message: 'Payment request not found.' });
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error('Error fetching payment request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to get payment statistics for a user (admin view)
export const getUserPaymentStatistics = async (req, res) => {
    const userId = req.user._id;
  
    try {
      // Fetch all payment records for the user
      const payments = await Payment.find({ userId });
  
      // Calculate total amounts for different time frames
      const today = moment().startOf('day');
      const weekStart = moment().startOf('week');
      const monthStart = moment().startOf('month');
      const yearStart = moment().startOf('year');
  
      const totalAmountToday = payments
        .filter(payment => moment(payment.createdAt).isAfter(today))
        .reduce((total, payment) => total + payment.amount, 0);
  
      const totalAmountWeek = payments
        .filter(payment => moment(payment.createdAt).isAfter(weekStart))
        .reduce((total, payment) => total + payment.amount, 0);
  
      const totalAmountMonth = payments
        .filter(payment => moment(payment.createdAt).isAfter(monthStart))
        .reduce((total, payment) => total + payment.amount, 0);
  
      const totalAmountYear = payments
        .filter(payment => moment(payment.createdAt).isAfter(yearStart))
        .reduce((total, payment) => total + payment.amount, 0);
  
      const totalPayments = payments.length;
  
      // Additional statistics
      const totalWithdrawals = payments
        .filter(payment => payment.type === 'withdrawal' && payment.status === 'completed')
        .reduce((total, payment) => total + payment.amount, 0);
  
      const totalDeposits = payments
        .filter(payment => payment.type === 'deposit' && payment.status === 'completed')
        .reduce((total, payment) => total + payment.amount, 0);
  
      const numberOfWithdrawals = payments.filter(payment => payment.type === 'withdrawal').length;
      const numberOfDeposits = payments.filter(payment => payment.type === 'deposit').length;
  
      const pendingWithdrawals = payments
        .filter(payment => payment.type === 'withdrawal' && payment.status === 'requested')
        .reduce((total, payment) => total + payment.amount, 0);
  
      const rejectedWithdrawals = payments
        .filter(payment => payment.type === 'withdrawal' && payment.status === 'rejected')
        .reduce((total, payment) => total + payment.amount, 0);
  
      const numberOfRejectedWithdrawals = payments.filter(
        payment => payment.type === 'withdrawal' && payment.status === 'rejected'
      ).length;
  
      const averageWithdrawalAmount =
        numberOfWithdrawals > 0 ? totalWithdrawals / numberOfWithdrawals : 0;
  
      const averageDepositAmount =
        numberOfDeposits > 0 ? totalDeposits / numberOfDeposits : 0;
  
      const successfulTransactionsCount = payments.filter(payment => payment.status === 'completed').length;
  
      res.status(200).json({
        totalAmountToday,
        totalAmountWeek,
        totalAmountMonth,
        totalAmountYear,
        totalPayments,
        totalWithdrawals,
        totalDeposits,
        numberOfWithdrawals,
        numberOfDeposits,
        pendingWithdrawals,
        rejectedWithdrawals,
        numberOfRejectedWithdrawals,
        averageWithdrawalAmount,
        averageDepositAmount,
        successfulTransactionsCount,
        payments, // Include detailed payment history
      });
    } catch (error) {
      console.error('Error fetching user payment statistics:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
