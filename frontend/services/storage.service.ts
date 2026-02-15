import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';

export const storage = {
    // Token Management
    async setAccessToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    },

    async getAccessToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    },

    async setRefreshToken(token: string): Promise<void> {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    },

    async getRefreshToken(): Promise<string | null> {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    },

    // User Data
    async setUserData(user: any): Promise<void> {
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    },

    async getUserData(): Promise<any | null> {
        const data = await SecureStore.getItemAsync(USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    // User Role
    async setUserRole(role: string): Promise<void> {
        await SecureStore.setItemAsync(USER_ROLE_KEY, role);
    },

    async getUserRole(): Promise<string | null> {
        return await SecureStore.getItemAsync(USER_ROLE_KEY);
    },

    // User ID
    async setUserId(userId: string): Promise<void> {
        await SecureStore.setItemAsync(USER_ID_KEY, userId);
    },

    async getUserId(): Promise<string | null> {
        return await SecureStore.getItemAsync(USER_ID_KEY);
    },

    // Clear All
    async clearAll(): Promise<void> {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        await SecureStore.deleteItemAsync(USER_ROLE_KEY);
        await SecureStore.deleteItemAsync(USER_ID_KEY);
    },
};
