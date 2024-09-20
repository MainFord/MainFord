import Payment from '../models/Payment.js';
import User from '../models/User.js';

export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
    res.status(200).json({ message: 'Admin logged in successfully.' });
  } else {
    res.status(403).json({ message: 'Invalid admin credentials.' });
  }
};

// Approve or reject withdrawal requests
export const updateWithdrawalStatus = async (req, res) => {
  const { paymentId, status } = req.body;

  try {
    const payment = await Payment.findByIdAndUpdate(paymentId, { status }, { new: true });
    res.status(200).json(payment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Approve user
export const approveUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, { adminApproved: true }, { new: true });
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
