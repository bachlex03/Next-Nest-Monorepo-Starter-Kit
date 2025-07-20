import { registerAs } from '@nestjs/config'
import { JwtSignOptions } from '@nestjs/jwt'

export default registerAs(
  'refresh-jwt',
  (): JwtSignOptions => ({
    secret: 'refresh-secret',
    expiresIn: '1h',
  }),
)
