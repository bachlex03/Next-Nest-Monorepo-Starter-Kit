import { registerAs } from '@nestjs/config'
import { JwtModuleOptions } from '@nestjs/jwt'

export default registerAs(
  'at-jwt',
  (): JwtModuleOptions => ({
    secret: process.env.AT_JWT_SECRET,
    signOptions: {
      expiresIn: process.env.AT_EXPIRE_IN || '1h',
    },
  }),
)
