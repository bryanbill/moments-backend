import { register } from '../controllers';
import express from 'express';
import { protect } from 'middleware/auth';
const router = express.Router();

router.post('/register', register);

export default router;
