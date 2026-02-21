import Joi from 'joi';

export const createOrganizationSchema = Joi.object({
  organization_name: Joi.string().required(),
  country: Joi.string().required(),
  description: Joi.string().optional(),
});

export const updateOrganizationSchema = Joi.object({
  organization_name: Joi.string().optional(),
  country: Joi.string().optional(),
  description: Joi.string().optional(),
});
