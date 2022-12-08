import { forgotPassword, getMe, login, logout, register, resetPassword, updateDetails, updatePassword, uploadChannelAvatar } from '../controllers';
import express from 'express';
import { protect } from '../middleware/auth';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/avatar', protect, uploadChannelAvatar);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

export default router;
