import * as Joi from 'joi'

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'provision').required(),
  PORT: Joi.number().required(),
  AT_JWT_SECRET: Joi.string().required(),
  AT_EXPIRE_IN: Joi.string().required(),
  RT_JWT_SECRET: Joi.string().required(),
  RT_EXPIRE_IN: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
})
