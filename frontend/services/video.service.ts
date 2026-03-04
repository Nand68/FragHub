import { api } from './api';

export interface VideoItem {
  _id: string;
  userId: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  likes: number;
  duration: number;
  width: number;
  height: number;
  createdAt: string;
  user?: {
    _id: string;
    email: string;
    role: string;
    username: string;
    avatarUrl: string;
  };
}

export interface LikeResult {
  videoId: string;
  likes: number;
  isLiked: boolean;
}

/** Upload a video (multipart/form-data). */
export const uploadVideo = async (
  videoUri: string,
  fileName: string,
  mimeType: string,
  caption?: string
): Promise<VideoItem> => {
  const formData = new FormData();
  // React Native / Expo FormData appends blobs by URI
  formData.append('video', {
    uri: videoUri,
    name: fileName,
    type: mimeType,
  } as any);
  if (caption) formData.append('caption', caption);

  const { data } = await api.post<{ success: boolean; data: VideoItem }>(
    '/videos/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000, // 2 min for large videos
    }
  );
  return data.data;
};

/** Fetch random feed videos. */
export const getRandomVideos = async (limit = 10): Promise<VideoItem[]> => {
  const { data } = await api.get<{ success: boolean; data: VideoItem[] }>(
    `/videos/random?limit=${limit}`
  );
  return data.data;
};

/** Fetch current user's uploaded videos. */
export const getMyVideos = async (): Promise<VideoItem[]> => {
  const { data } = await api.get<{ success: boolean; data: VideoItem[] }>(
    '/videos/my-videos'
  );
  return data.data;
};

/** Delete a video owned by current user. */
export const deleteVideo = async (videoId: string): Promise<void> => {
  await api.delete(`/videos/${videoId}`);
};

/** Toggle like on a video. Returns updated like count and isLiked. */
export const toggleLike = async (videoId: string): Promise<LikeResult> => {
  const { data } = await api.post<{ success: boolean; data: LikeResult }>(
    `/videos/${videoId}/like`
  );
  return data.data;
};

/** Fetch videos uploaded by a specific user (for player profile view). */
export const getVideosByUserId = async (userId: string): Promise<VideoItem[]> => {
  const { data } = await api.get<{ success: boolean; data: VideoItem[] }>(
    `/videos/user/${userId}`
  );
  return data.data;
};
