import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'

import { JwtPayload } from 'src/domain/core/types/jwt-payload'
import { AuthService } from 'src/modules/auth/auth.service'
import AccessTokenJwtConfig from 'src/infrastructure/configs/jwt/at-jwt.config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AccessTokenJwtConfig.KEY)
    private readonly accessTokenConfig: ConfigType<typeof AccessTokenJwtConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: accessTokenConfig.secret,
      ignoreExpiration: false,
    })
  }

  validate(payload: JwtPayload) {
    const userId = payload.userId

    return this.authService.validateJwtUser(userId)
  }
}

/**
 * default name: 'jwt'
 * 'jwt' used for @UseGuards(JwtAuthGuard)
 */
