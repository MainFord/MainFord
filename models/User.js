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
    accountNumber: { 
      type: String, 
      get: decrypt, 
      set: encrypt, 
      default: ''  // Default value set to an empty string
    },
    ifsc: { 
      type: String, 
      get: decrypt, 
      set: encrypt, 
      default: ''  // Default value set to an empty string
    },
    holderName: { 
      type: String, 
      get: decrypt, 
      set: encrypt, 
      default: ''  // Default value set to an empty string
    },
  },
  
  photoUrl: { type: String, default:'https://ideogram.ai/assets/progressive-image/balanced/response/6z5HqcytSX2hHcE3AxKUBg' }, // Cloudinary image URL
  adminApproved: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, required: true }, // Unique referral code
  referredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null  // Default value set to null
  },
  paymentUrlOfReg: {type: String, required:true},
  paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
}, { timestamps: true });

export default mongoose.model('User', userSchema);
