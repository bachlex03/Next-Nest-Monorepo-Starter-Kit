import { Inject, Injectable } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'

import { STRATEGY_NAME } from 'src/api/common/constants/strategy-name.constant'
import { JwtPayload } from 'src/domain/core/types/jwt-payload'
import RefreshTokenJwtConfig from 'src/infrastructure/configs/jwt/rt-jwt.config'
import { AuthService } from 'src/modules/auth/auth.service'

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, STRATEGY_NAME.REFRESH_JWT) {
  constructor(
    @Inject(RefreshTokenJwtConfig.KEY) private refreshTokenJwtConfig: ConfigType<typeof RefreshTokenJwtConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: refreshTokenJwtConfig.secret,
      ignoreExpiration: false,
      passReqToCallback: true,
    })
  }

  validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim() || ''

    console.log('refreshToken', refreshToken)

    const userId = payload.userId

    return this.authService.validateRefreshToken(userId, refreshToken)
  }
}

/**
 * STRATEGY_NAME.REFRESH_JWT used for @UseGuards(RefreshAuthGuard)
 */
