import api from './api';
import { ENDPOINTS } from '../constants/config';
import { storage } from './storage.service';

interface SignupData {
    email: string;
    password: string;
    role: 'player' | 'organisation';
}

interface LoginData {
    email: string;
    password: string;
}

interface VerifyOTPData {
    email: string;
    otp: string;
}

interface ResetPasswordData {
    email: string;
    otp: string;
    newPassword: string;
}

interface AuthResponse {
    message?: string;
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    userId?: string;
}

export const authService = {
    // Signup
    async signup(data: SignupData): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.SIGNUP, data);
        return response.data;
    },

    // Verify OTP
    async verifyOTP(data: VerifyOTPData): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.VERIFY_OTP, data);
        return response.data;
    },

    // Resend OTP
    async resendOTP(email: string): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.RESEND_OTP, { email });
        return response.data;
    },

    // Login
    async login(data: LoginData): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.LOGIN, data);

        // Store tokens, role, and userId
        if (response.data.accessToken) {
            await storage.setAccessToken(response.data.accessToken);
        }
        if (response.data.refreshToken) {
            await storage.setRefreshToken(response.data.refreshToken);
        }
        if (response.data.role) {
            await storage.setUserRole(response.data.role);
        }
        if (response.data.userId) {
            await storage.setUserId(response.data.userId);
        }

        return response.data;
    },

    // Forgot Password
    async forgotPassword(email: string): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
        return response.data;
    },

    // Reset Password
    async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
        return response.data;
    },

    // Refresh Token
    async refreshToken(refreshToken: string): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken });
        return response.data;
    },

    // Logout
    async logout(userId: string): Promise<AuthResponse> {
        const response = await api.post(ENDPOINTS.AUTH.LOGOUT, { userId });
        await storage.clearAll();
        return response.data;
    },

    // Get Profile (Protected route example)
    async getProfile(): Promise<any> {
        const response = await api.get(ENDPOINTS.AUTH.PROFILE);
        return response.data;
    },
};
