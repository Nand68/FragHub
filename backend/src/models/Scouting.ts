import mongoose, { Schema, Document } from 'mongoose';
import { Device, Gender } from './PlayerProfile';

export enum SalaryType {
  FIXED_SALARY = 'fixed_salary',
  CONTRACT_BASED = 'contract_based',
  TOURNAMENT_PRIZE_SPLIT = 'tournament_prize_split',
  PERFORMANCE_BASED = 'performance_based',
  STIPEND_SUPPORT = 'stipend_support',
  UNPAID_TRIAL = 'unpaid_trial',
}

export enum ContractDuration {
  NO_CONTRACT = 'no_contract',
  THREE_MONTHS = '3_months',
  SIX_MONTHS = '6_months',
  ONE_YEAR = '1_year',
}

export enum ScoutingStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IScouting extends Document {
  organizationId: mongoose.Types.ObjectId;
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
}

const scoutingSchema = new Schema<IScouting>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    organization_name: { type: String, required: true },
    organization_description: { type: String },
    country: { type: String, required: true },
    salary_type: { type: String, enum: Object.values(SalaryType), required: true },
    salary_min_usd: { type: Number },
    salary_max_usd: { type: Number },
    contract_duration: { type: String, enum: Object.values(ContractDuration), required: true },
    device_provided: { type: Boolean, required: true },
    bootcamp_required: { type: Boolean, required: true },
    required_roles: [{ type: String, required: true }],
    allowed_devices: [{ type: String, enum: Object.values(Device), required: true }],
    min_age: { type: Number },
    max_age: { type: Number },
    allowed_genders: [{ type: String, enum: Object.values(Gender), required: true }],
    min_kd_ratio: { type: Number },
    min_average_damage: { type: Number },
    ban_history_allowed: { type: Boolean, required: true },
    preferred_maps_required: [{ type: String }],
    required_tournaments: [{ type: String }],
    players_required: { type: Number, required: true, min: 1 },
    selected_count: { type: Number, default: 0 },
    scouting_status: { type: String, enum: Object.values(ScoutingStatus), default: ScoutingStatus.ACTIVE },
  },
  { timestamps: true }
);

export default mongoose.model<IScouting>('Scouting', scoutingSchema);
