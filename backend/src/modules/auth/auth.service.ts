import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from 'src/domain/core/types/jwt-payload'
import { compare } from 'bcrypt'
import RefreshTokenJwtConfig from 'src/infrastructure/configs/jwt/rt-jwt.config'
import * as argon2 from 'argon2'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(RefreshTokenJwtConfig.KEY) private refreshTokenConfig: ConfigType<typeof RefreshTokenJwtConfig>,
  ) {}

  async login() {
    const { accessToken, refreshToken } = await this.generateTokens()

    const hashedRefreshToken = await argon2.hash(refreshToken)

    // await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
    }
  }

  async logout() {
    // await this.userService.updateHashedRefreshToken(userId, null);

    return true
  }

  async refreshToken() {
    const { accessToken, refreshToken } = await this.generateTokens()

    const hashedRefreshToken = await argon2.hash(refreshToken)

    // await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
    }
  }

  // Local Strategy
  async validateUser(email: string, password: string) {
    // const user = await this.userService.findByEmail(email)

    // if (!user) throw new UnauthorizedException('User not found!')

    // const isPasswordMatch = await compare(password, user.password)

    // if (!isPasswordMatch) {
    //   throw new UnauthorizedException('Invalid credentials')
    // }

    // return { id: user.id }
    return {
      test: 'Local Strategy',
    }
  }

  // JWT Strategy
  async validateJwtUser(userId: string) {
    // const user = await this.userService.findOne(userId)
    // if (!user) throw new UnauthorizedException('User not found!')
    // const currentUser: CurrentUser = { id: user.id, role: user.role }
    // return currentUser

    return {
      test: 'JWT Strategy',
    }
  }

  // Refresh Strategy
  async validateRefreshToken(userId: string, refreshToken: string) {
    // const user = await this.userService.findOne(userId);
    // if (!user || !user.hashedRefreshToken)
    //   throw new UnauthorizedException('Invalid Refresh Token');

    // const refreshTokenMatches = await argon2.verify(
    //   user.hashedRefreshToken,
    //   refreshToken,
    // );
    // if (!refreshTokenMatches)
    //   throw new UnauthorizedException('Invalid Refresh Token');

    // return { id: userId };
    return {
      test: 'Refresh Strategy',
    }
  }

  private async generateTokens() {
    const payload = {
      test: 'payload',
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, this.refreshTokenConfig),
    ])

    return {
      accessToken,
      refreshToken,
    }
  }
}
