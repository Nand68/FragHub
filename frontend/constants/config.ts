export const API_CONFIG = {
    BASE_URL: 'http://10.207.37.219:5000/api',
    TIMEOUT: 10000,
};

export const ENDPOINTS = {
    AUTH: {
        SIGNUP: '/auth/signup',
        LOGIN: '/auth/login',
        VERIFY_OTP: '/auth/verify-otp',
        RESEND_OTP: '/auth/resend-otp',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        REFRESH_TOKEN: '/auth/refresh-token',
        LOGOUT: '/auth/logout',
        PROFILE: '/auth/profile',
    },
};
