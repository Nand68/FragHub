import { api } from './api';

export type Organization = {
  _id: string;
  organization_name: string;
  country: string;
  description?: string;
};

type OrgResponse = {
  success: boolean;
  data: Organization;
};

type RosterResponse = {
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    game_id: string;
    kd_ratio: number;
    average_damage: number;
    roles: string[];
    currentOrganization?: string;
  }>;
};

export async function fetchOrganization(): Promise<Organization | null> {
  try {
    const { data } = await api.get<OrgResponse>('/organization');
    return data.data;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    if (err?.response?.status === 404) return null;
    throw error;
  }
}

export async function createOrganization(payload: {
  organization_name: string;
  country: string;
  description?: string;
}) {
  const { data } = await api.post<OrgResponse>('/organization', payload);
  return data.data;
}

export async function updateOrganization(payload: {
  organization_name?: string;
  country?: string;
  description?: string;
}) {
  const { data } = await api.put<OrgResponse>('/organization', payload);
  return data.data;
}

export type RosterPlayer = {
  _id: string;
  name: string;
  game_id: string;
  kd_ratio: number;
  average_damage: number;
  roles: string[];

};

export async function getRoster(): Promise<RosterPlayer[]> {
  const { data } = await api.get<RosterResponse>('/organization/roster');
  return data.data;
}

export async function removePlayerFromRoster(playerId: string) {
  await api.delete(`/organization/roster/${playerId}`);
}

// ── Player's own organization view ─────────────────────────────────────────────
export type Teammate = {
  _id: string;
  name: string;
  game_id: string;
  kd_ratio: number;
  average_damage: number;
  roles: string[];
  device?: string;
  country?: string;
};

export type MyOrganizationData = {
  organization: {
    _id: string;
    organization_name: string;
    country: string;
    description?: string;
  };
  teammates: Teammate[];
};

type MyOrgResponse = { success: boolean; data: MyOrganizationData | null };

export async function getMyOrganization(): Promise<MyOrganizationData | null> {
  const { data } = await api.get<MyOrgResponse>('/profile/my-organization');
  return data.data;
}

export async function leaveOrganization(): Promise<void> {
  await api.delete('/profile/my-organization');
}

