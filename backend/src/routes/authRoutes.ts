import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import * as authValidation from '../validations/authValidation';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/signup', validate(authValidation.signupSchema), authController.signup);
router.post('/verify-otp', validate(authValidation.verifyOTPSchema), authController.verifyOTP);
router.post('/login', validate(authValidation.loginSchema), authController.login);
router.post('/request-reset', validate(authValidation.requestResetSchema), authController.requestPasswordReset);
router.post('/reset-password', validate(authValidation.resetPasswordSchema), authController.resetPassword);
router.post('/refresh-token', validate(authValidation.refreshTokenSchema), authController.refreshToken);

// Avatar update — requires auth
router.patch('/avatar', authenticate, validate(authValidation.updateAvatarSchema), authController.updateAvatar);
router.post('/avatar/upload', authenticate, upload.single('image'), authController.uploadAvatarImage);

// Public profile — open (no auth required, so anyone can view)
router.get('/public-profile/:userId', authController.getPublicProfile);

export default router;
