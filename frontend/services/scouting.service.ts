import { api } from './api';
import { Device, Gender } from './playerProfile.service';

export type SalaryType =
  | 'fixed_salary'
  | 'contract_based'
  | 'tournament_prize_split'
  | 'performance_based'
  | 'stipend_support'
  | 'unpaid_trial';

export type ContractDuration = 'no_contract' | '3_months' | '6_months' | '1_year';

export type ScoutingStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type Scouting = {
  _id: string;
  organizationId: string;
  organization_name: string;
  organization_description?: string;
  country: string;
  salary_type: SalaryType;
  salary_min_usd?: number;
  salary_max_usd?: number;
  contract_duration: ContractDuration;
  device_provided: boolean;
  bootcamp_required: boolean;
  required_roles: string[];
  allowed_devices: Device[];
  min_age?: number;
  max_age?: number;
  allowed_genders: Gender[];
  min_kd_ratio?: number;
  min_average_damage?: number;
  ban_history_allowed: boolean;
  preferred_maps_required?: string[];
  required_tournaments?: string[];
  players_required: number;
  selected_count: number;
  scouting_status: ScoutingStatus;
};

type ScoutingListResponse = {
  success: boolean;
  data: Scouting[];
};

type ScoutingResponse = {
  success: boolean;
  data: Scouting;
};

export async function listActiveScoutings(filters?: {
  country?: string;
  salary_type?: SalaryType;
}): Promise<Scouting[]> {
  const { data } = await api.get<ScoutingListResponse>('/scouting/active', {
    params: filters,
  });
  return data.data;
}

export async function getScoutingById(id: string): Promise<Scouting> {
  const { data } = await api.get<ScoutingResponse>(`/scouting/${id}`);
  return data.data;
}

export type CreateScoutingPayload = {
  organization_name: string;
  organization_description?: string;
  country: string;
  salary_type: SalaryType;
  salary_min_usd?: number;
  salary_max_usd?: number;
  contract_duration: ContractDuration;
  device_provided: boolean;
  bootcamp_required: boolean;
  required_roles: string[];
  allowed_devices: Device[];
  min_age?: number;
  max_age?: number;
  allowed_genders: Gender[];
  min_kd_ratio?: number;
  min_average_damage?: number;
  ban_history_allowed: boolean;
  preferred_maps_required?: string[];
  required_tournaments?: string[];
  players_required: number;
};

export async function createScouting(payload: CreateScoutingPayload): Promise<Scouting> {
  const { data } = await api.post<ScoutingResponse>('/scouting', payload);
  return data.data;
}

export async function getMyActiveScouting(): Promise<Scouting | null> {
  try {
    const { data } = await api.get<ScoutingResponse>('/scouting/my/active');
    return data.data;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    if (err?.response?.status === 404) return null;
    throw error;
  }
}

export async function updateScouting(
  scoutingId: string,
  payload: Partial<CreateScoutingPayload>
): Promise<Scouting> {
  const { data } = await api.put<ScoutingResponse>(`/scouting/${scoutingId}`, payload);
  return data.data;
}

export async function cancelScouting(scoutingId: string) {
  await api.delete(`/scouting/${scoutingId}`);
}

