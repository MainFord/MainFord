import User from '../models/User.js';

export const verifyEmail = async (req, res, next) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ emailVerificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid token.' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
