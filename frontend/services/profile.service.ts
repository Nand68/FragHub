import api from './api';

export interface UserProfile {
    _id?: string;
    userId?: string;
    age?: number;
    gender?: string;
    country?: string;
    pubgUID?: string;
    primaryRole?: string;
    secondaryRole?: string;
    experience?: string[];
    experienceOther?: string;
    yearsOfExperience?: number;
    achievements?: string;
    previousOrganization?: string;
    deviceType?: string;
    fingerSetup?: string;
    gyroscope?: boolean;
    kdRatio?: number;
    averageDamage?: number;
    preferredMaps?: string[];
    playstyle?: string;
    socialLinks?: {
        instagram?: string;
        twitter?: string;
        youtube?: string;
    };
    banHistory?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProfileResponse {
    success: boolean;
    exists?: boolean;
    message?: string;
    data?: UserProfile | null;
}

class ProfileService {
    async getProfile(): Promise<ProfileResponse> {
        const response = await api.get<ProfileResponse>('/profile');
        return response.data;
    }

    async createProfile(profileData: Partial<UserProfile>): Promise<ProfileResponse> {
        const response = await api.post<ProfileResponse>('/profile', profileData);
        return response.data;
    }

    async updateProfile(profileData: Partial<UserProfile>): Promise<ProfileResponse> {
        const response = await api.put<ProfileResponse>('/profile', profileData);
        return response.data;
    }
}

export default new ProfileService();
