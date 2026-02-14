import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage.service';
import { authService } from '../services/auth.service';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (accessToken: string, refreshToken: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const token = await storage.getAccessToken();
            setIsAuthenticated(!!token);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (accessToken: string, refreshToken: string) => {
        await storage.setAccessToken(accessToken);
        await storage.setRefreshToken(refreshToken);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            // Optionally call backend logout
            // await authService.logout(userId);
            await storage.clearAll();
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
