import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage.service';
import { authService } from '../services/auth.service';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userRole: string | null;
    userId: string | null;
    login: (accessToken: string, refreshToken: string, role?: string, userId?: string) => Promise<void>;
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
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const checkAuth = async () => {
        try {
            const token = await storage.getAccessToken();
            const role = await storage.getUserRole();
            const id = await storage.getUserId();
            setIsAuthenticated(!!token);
            setUserRole(role);
            setUserId(id);
        } catch (error) {
            setIsAuthenticated(false);
            setUserRole(null);
            setUserId(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (accessToken: string, refreshToken: string, role?: string, userId?: string) => {
        await storage.setAccessToken(accessToken);
        await storage.setRefreshToken(refreshToken);
        if (role) {
            await storage.setUserRole(role);
            setUserRole(role);
        }
        if (userId) {
            await storage.setUserId(userId);
            setUserId(userId);
        }
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            // Optionally call backend logout
            // await authService.logout(userId);
            await storage.clearAll();
            setIsAuthenticated(false);
            setUserRole(null);
            setUserId(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                userRole,
                userId,
                login,
                logout,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
