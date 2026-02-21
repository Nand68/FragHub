import { api } from './api';
import { Scouting } from './scouting.service';

export type ApplicationStatus = 'PENDING' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';

export type Application = {
  _id: string;
  scoutingId: Scouting;
  organizationId: {
    _id: string;
    organization_name: string;
  };
  status: ApplicationStatus;
  appliedAt: string;
};

type ApplicationsResponse = {
  success: boolean;
  data: Application[];
};

type ApplicationResponse = {
  success: boolean;
  data: Application;
};

export async function applyToScouting(scoutingId: string) {
  const { data } = await api.post<ApplicationResponse>(`/applications/apply/${scoutingId}`, {});
  return data.data;
}

export async function withdrawApplication(applicationId: string) {
  await api.delete(`/applications/${applicationId}/withdraw`);
}

export async function reapplyToScouting(scoutingId: string) {
  const { data } = await api.post<ApplicationResponse>(`/applications/apply/${scoutingId}`, {});
  return data.data;
}

export async function getMyApplications(): Promise<Application[]> {
  const { data } = await api.get<ApplicationsResponse>('/applications/my');
  return data.data;
}

export type Applicant = {
  _id: string;
  playerId: {
    _id: string;
    name: string;
    game_id: string;
    kd_ratio: number;
    average_damage: number;
    roles: string[];
    age: number;
    device: string;
    userId?: { email: string };
  };
  status: ApplicationStatus;
  appliedAt: string;
};

type ApplicantsResponse = {
  success: boolean;
  data: Applicant[];
};

export async function getScoutingApplicants(scoutingId: string): Promise<Applicant[]> {
  const { data } = await api.get<ApplicantsResponse>(`/applications/scouting/${scoutingId}`);
  return data.data;
}

export async function selectApplicant(applicationId: string) {
  await api.post(`/applications/${applicationId}/select`);
}

export async function rejectApplicant(applicationId: string) {
  await api.post(`/applications/${applicationId}/reject`);
}

