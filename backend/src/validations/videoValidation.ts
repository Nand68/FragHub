import Joi from 'joi';

export const uploadVideoSchema = Joi.object({
  caption: Joi.string().max(500).optional().allow(''),
});

export const videoIdSchema = Joi.object({
  videoId: Joi.string().required(),
});
