import { api } from './api';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type Device = 'mobile' | 'tablet';
export type FingerSetup = 'thumb' | '2_finger' | '3_finger' | '4_finger' | '5_finger' | '6_finger';
export type PlayingStyle = 'aggressive' | 'balanced' | 'defensive';

export type PlayerProfile = {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  country: string;
  game_id: string;
  device: Device;
  finger_setup: FingerSetup;
  kd_ratio: number;
  average_damage: number;
  roles: string[];
  playing_style: PlayingStyle;
  preferred_maps: string[];
  ban_history: boolean;
  years_experience?: number;
  youtube_url?: string;
  instagram_url?: string;
  tournaments_played?: string[];
  other_tournament_name?: string;
  bio?: string;
  previous_organization?: string;
  profile_completed: boolean;
  stats_verified: boolean;
  currentOrganization?: {
    _id: string;
    organization_name: string;
  } | null;
};

type ProfileResponse = {
  success: boolean;
  data: PlayerProfile;
};

export async function fetchPlayerProfile(): Promise<PlayerProfile | null> {
  try {
    const { data } = await api.get<ProfileResponse>('/profile');
    return data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function fetchPlayerProfileById(profileId: string): Promise<PlayerProfile> {
  const { data } = await api.get<ProfileResponse>(`/profile/${profileId}`);
  return data.data;
}

export type UpsertPlayerProfileInput = Omit<
  PlayerProfile,
  '_id' | 'profile_completed' | 'stats_verified' | 'currentOrganization'
>;

export async function createPlayerProfile(payload: UpsertPlayerProfileInput) {
  const { data } = await api.post<ProfileResponse>('/profile', payload);
  return data.data;
}

export async function updatePlayerProfile(payload: Partial<UpsertPlayerProfileInput>) {
  const { data } = await api.put<ProfileResponse>('/profile', payload);
  return data.data;
}

