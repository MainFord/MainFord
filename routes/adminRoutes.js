import express from 'express';
import { adminLogin, updateWithdrawalStatus, approveUser } from '../controllers/adminController.js';
import { adminAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.put('/withdrawal-status', adminAuth, updateWithdrawalStatus);
router.put('/approve-user', adminAuth, approveUser);

export default router;
