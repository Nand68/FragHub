import Joi from 'joi';
import { SalaryType, ContractDuration } from '../models/Scouting';
import { Device, Gender } from '../models/PlayerProfile';

export const createScoutingSchema = Joi.object({
  organization_name: Joi.string().required(),
  organization_description: Joi.string().optional(),
  country: Joi.string().required(),
  salary_type: Joi.string().valid(...Object.values(SalaryType)).required(),
  salary_min_usd: Joi.number().min(0).optional(),
  salary_max_usd: Joi.number().min(0).optional(),
  contract_duration: Joi.string().valid(...Object.values(ContractDuration)).required(),
  device_provided: Joi.boolean().required(),
  bootcamp_required: Joi.boolean().required(),
  required_roles: Joi.array().items(Joi.string()).min(1).required(),
  allowed_devices: Joi.array().items(Joi.string().valid(...Object.values(Device))).min(1).required(),
  min_age: Joi.number().min(13).optional(),
  max_age: Joi.number().max(100).optional(),
  allowed_genders: Joi.array().items(Joi.string().valid(...Object.values(Gender))).min(1).required(),
  min_kd_ratio: Joi.number().min(0).optional(),
  min_average_damage: Joi.number().min(0).optional(),
  ban_history_allowed: Joi.boolean().required(),
  preferred_maps_required: Joi.array().items(Joi.string()).optional(),
  required_tournaments: Joi.array().items(Joi.string()).optional(),
  players_required: Joi.number().min(1).required(),
});

export const updateScoutingSchema = Joi.object({
  organization_description: Joi.string().optional(),
  salary_min_usd: Joi.number().min(0).optional(),
  salary_max_usd: Joi.number().min(0).optional(),
  device_provided: Joi.boolean().optional(),
  bootcamp_required: Joi.boolean().optional(),
  players_required: Joi.number().min(1).optional(),
});
