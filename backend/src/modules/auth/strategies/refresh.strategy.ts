import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthJwtPayload } from 'src/domain/core/types/auth-jwtpayload'
import refreshJwtConfig from 'src/infrastructure/configs/jwt/refresh-jwt.config'

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
  constructor(@Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'refresh-secret',
      ignoreExpiration: false,
    })
  }

  validate(payload: AuthJwtPayload) {
    return {
      id: payload.id,
    }
  }
}
