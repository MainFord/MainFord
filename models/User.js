import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryptUtils.js';

// Helper function to generate a placeholder URL with initials
function generatePlaceholderUrl(name) {
  const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
  return `https://ui-avatars.com/api/?name=${initials}&background=random&size=128`;
}

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
      default: ''  
    },
    ifsc: { 
      type: String, 
      get: decrypt, 
      set: encrypt, 
      default: ''  
    },
    holderName: { 
      type: String, 
      get: decrypt, 
      set: encrypt, 
      default: ''  
    },
  },
  photoUrl: { 
    type: String, 
    default: function() {
      return generatePlaceholderUrl(this.name);
    }
  },
  adminApproved: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, required: true }, 
  referredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null  
  },
  paymentUrlOfReg: { type: String, required: true },
  paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  courses: {
    type: [{
      url1: { type: String, default: 'PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt' },
      url2: { type: String, default: 'PLXwTOG3-tRwiJmAyVJ47SVvv-dUIy2S0I' },
      url3: { type: String, default: 'PLXwTOG3-tRwgy4lJ9j_CPwpJmr2uCaGH1' },
    }],
    default: [{
      url1: 'PLfqMhTWNBTe137I_EPQd34TsgV6IO55pt',
      url2: 'PLXwTOG3-tRwiJmAyVJ47SVvv-dUIy2S0I',
      url3: 'PLXwTOG3-tRwgy4lJ9j_CPwpJmr2uCaGH1',
    }]
  },
  images: {
    type: [String],
    default: [
      'https://ideogram.ai/assets/progressive-image/balanced/response/wUu8Po0rQ0WrA5OqArfPmA',
      'https://ideogram.ai/assets/progressive-image/balanced/response/dAC7-GSCTz6EI_EvLDS79A',
      'https://ideogram.ai/assets/progressive-image/balanced/response/6EOusTEdRIiBoBmpWM3BmA',
      'https://ideogram.ai/assets/image/lossless/response/b_r77_V0SqCSlVDlqQ5jdg'
    ]
  },
  password: {
    type: String,
  },
  balance: {
    type: Number,
    default: 250
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
