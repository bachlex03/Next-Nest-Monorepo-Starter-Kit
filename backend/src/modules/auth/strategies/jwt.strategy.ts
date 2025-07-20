import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { AuthJwtPayload } from 'src/domain/core/types/auth-jwtpayload'
import { Request } from 'express'
import { AuthService } from '../auth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secret',
      ignoreExpiration: false,
      passReqToCallback: true,
    })
  }

  validate(req: Request, payload: AuthJwtPayload) {
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim() || ''

    const userId = payload.id

    return this.authService.validateRefreshToken(userId, refreshToken)
  }
}
