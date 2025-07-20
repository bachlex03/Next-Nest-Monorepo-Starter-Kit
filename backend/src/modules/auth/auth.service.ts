import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthJwtPayload } from 'src/domain/core/types/auth-jwtpayload'
import refreshJwtConfig from 'src/infrastructure/configs/jwt/refresh-jwt.config'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(refreshJwtConfig.KEY) private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
  ) {}
  login() {
    const payload: AuthJwtPayload = {
      id: 'user-id',
    }

    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, this.refreshJwtConfiguration)

    return {
      accessToken,
      refreshToken,
    }
  }

  async refreshToken(id: string) {
    const payload: AuthJwtPayload = {
      id: 'user-id',
    }

    const accessToken = this.jwtService.sign(payload)

    return {
      accessToken,
    }
  }

  async validateUser(email: string, password: string) {
    try {
      return {
        id: 'user-id',
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials')
    }
  }
}
