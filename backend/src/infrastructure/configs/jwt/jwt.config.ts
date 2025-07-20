import { registerAs } from '@nestjs/config'
import { JwtModuleOptions } from '@nestjs/jwt'

const jwtConfig = registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: 'secret',
    signOptions: {
      expiresIn: '1h',
    },
  }),
)

export default jwtConfig
