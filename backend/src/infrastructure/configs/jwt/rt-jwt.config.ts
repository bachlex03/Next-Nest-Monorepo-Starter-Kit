import { registerAs } from '@nestjs/config'
import { JwtSignOptions } from '@nestjs/jwt'

export default registerAs(
  'rt-jwt',
  (): JwtSignOptions => ({
    secret: process.env.RT_JWT_SECRET,
    expiresIn: process.env.RT_EXPIRE_IN || '1d',
  }),
)
