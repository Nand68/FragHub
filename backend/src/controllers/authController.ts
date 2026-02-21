import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import OTP from '../models/OTP';
import RefreshToken from '../models/RefreshToken';
import { AppError } from '../utils/AppError';
import { generateOTP, getOTPExpiry } from '../utils/otpGenerator';
import { sendOTPEmail } from '../utils/emailService';
import { config } from '../config/env';
import jwt, { Secret, SignOptions } from "jsonwebtoken";


export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return next(new AppError('Email already registered', 400));

    await User.create({ email, password, role });
    const otp = generateOTP();
    await OTP.create({ email, otp, type: 'signup', expiresAt: getOTPExpiry() });
    await sendOTPEmail(email, otp);

    res.status(201).json({ success: true, message: 'OTP sent to email. Please verify to complete signup.' });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp, type: 'signup', expiresAt: { $gt: new Date() } });
    if (!otpRecord) return next(new AppError('Invalid or expired OTP', 400));

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await OTP.deleteMany({ email, type: 'signup' });

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }
    if (!user.isVerified) return next(new AppError('Please verify your email first', 401));

    const accessToken = jwt.sign(
      { id: user._id.toString(), role: user.role },
      config.jwtAccessSecret as Secret,
      { expiresIn: config.jwtAccessExpiry } as SignOptions
    );

    const refreshToken = jwt.sign(
      { id: user._id.toString() },
      config.jwtRefreshSecret as Secret,
      { expiresIn: config.jwtRefreshExpiry } as SignOptions
    );

    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

    res.status(200).json({ success: true, accessToken, refreshToken, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new AppError('User not found', 404));

    const otp = generateOTP();
    await OTP.create({ email, otp, type: 'reset_password', expiresAt: getOTPExpiry() });
    await sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    const otpRecord = await OTP.findOne({ email, otp, type: 'reset_password', expiresAt: { $gt: new Date() } });
    if (!otpRecord) return next(new AppError('Invalid or expired OTP', 400));

    const user = await User.findOne({ email });
    if (!user) return next(new AppError('User not found', 404));

    user.password = newPassword;
    await user.save();
    await OTP.deleteMany({ email, type: 'reset_password' });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string };
    const tokenRecord = await RefreshToken.findOne({ userId: decoded.id, token: refreshToken, expiresAt: { $gt: new Date() } });
    if (!tokenRecord) return next(new AppError('Invalid refresh token', 401));

    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('User not found', 404));

    const accessToken = jwt.sign(
      { id: user._id.toString(), role: user.role },
      config.jwtAccessSecret as Secret,
      { expiresIn: config.jwtAccessExpiry } as SignOptions
    );
    res.status(200).json({ success: true, accessToken });
  } catch (error) {
    next(new AppError('Invalid refresh token', 401));
  }
};
