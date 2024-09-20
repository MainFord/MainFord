import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryptUtils.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  dob: { type: Date, required: true },
  accountDetails: {
    accountNumber: { type: String, get: decrypt, set: encrypt },
    ifsc: { type: String, get: decrypt, set: encrypt },
    holderName: { type: String, get: decrypt, set: encrypt },
  },
  photoUrl: { type: String, required: true }, // Cloudinary image URL
  adminApproved: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, required: true }, // Unique referral code
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
