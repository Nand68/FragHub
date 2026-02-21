import nodemailer from 'nodemailer';
import { config } from '../config/env';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  try {
    await transporter.sendMail({ from: config.smtp.user, to, subject, text });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const subject = 'Your OTP Code';
  const text = `Your OTP code is: ${otp}. It will expire in 10 minutes.`;
  await sendEmail(email, subject, text);
};
