import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import * as authValidation from '../validations/authValidation';

const router = Router();

router.post('/signup', validate(authValidation.signupSchema), authController.signup);
router.post('/verify-otp', validate(authValidation.verifyOTPSchema), authController.verifyOTP);
router.post('/login', validate(authValidation.loginSchema), authController.login);
router.post('/request-reset', validate(authValidation.requestResetSchema), authController.requestPasswordReset);
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', validate(authValidation.refreshTokenSchema), authController.refreshToken);

export default router;
