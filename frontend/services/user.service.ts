import { api } from './api';

export interface PublicUserProfile {
    user: {
        id: string;
        username: string;
        avatarUrl: string;
        role: string;
        email: string;
    };
    playerProfile: any | null;
    videos: Array<{
        _id: string;
        videoUrl: string;
        thumbnailUrl: string;
        caption?: string;
        duration: number;
        likes: number;
        createdAt: string;
    }>;
}

/** Fetch a user's public profile (info + player profile + clips). */
export const getPublicProfile = async (userId: string): Promise<PublicUserProfile> => {
    const { data } = await api.get<{ success: boolean } & PublicUserProfile>(
        `/auth/public-profile/${userId}`
    );
    return { user: data.user, playerProfile: data.playerProfile, videos: data.videos };
};

/** Upload avatar image to our backend. */
export const uploadAvatar = async (
    imageUri: string,
    fileName: string,
    mimeType: string
): Promise<string> => {
    const formData = new FormData();
    formData.append('image', {
        uri: imageUri,
        name: fileName,
        type: mimeType,
    } as any);

    const { data } = await api.post<{ success: boolean; avatarUrl: string }>(
        '/auth/avatar/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return data.avatarUrl;
};
