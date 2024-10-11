import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  requestDate: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
