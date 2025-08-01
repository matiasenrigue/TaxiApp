import { Router } from 'express';
import { signup, signin, refresh, logout } from './auth.controller';
import protect from '../../shared/middleware/auth.middleware';
import { signupValidation, signinValidation } from '../../shared/middleware/validation.middleware';


const router = Router();

router.post('/signup', ...signupValidation, signup);
router.post('/signin', ...signinValidation, signin);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);

export default router;
