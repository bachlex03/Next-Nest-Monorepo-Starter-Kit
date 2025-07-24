import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from 'src/domain/core/types/jwt-payload'
import * as bcrypt from 'bcrypt'
import * as argon2 from 'argon2'
import RefreshTokenJwtConfig from 'src/infrastructure/configs/jwt/rt-jwt.config'
import { RegisterDto } from 'src/api/dtos/auth/register.dto'
import { UserEntity } from 'src/domain/entities/users.entity'
import { UsersService } from '../users/users.service'
import { TokenService } from '../token/token.service'
import { LoginDto } from 'src/api/dtos/auth/login.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    @Inject(RefreshTokenJwtConfig.KEY) private refreshTokenConfig: ConfigType<typeof RefreshTokenJwtConfig>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email)

    if (!user) {
      throw new UnauthorizedException('User not found!')
    }

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password)

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.id)

    const hashedRefreshToken = await argon2.hash(refreshToken)

    const isTokenStored = await this.tokenService.storeRefreshToken(user.id, hashedRefreshToken)

    if (!isTokenStored) {
      throw new BadRequestException('Failed to store refresh token')
    }

    return {
      accessToken,
      refreshToken,
    }
  }

  async register(dto: RegisterDto): Promise<boolean> {
    const isUserExist = await this.userService.findByEmail(dto.email)

    if (isUserExist) {
      throw new BadRequestException('User already exists')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const newUser = UserEntity.toEntity({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
    })

    const result = await this.userService.create(newUser)

    if (!result) {
      throw new BadRequestException('Failed to create user')
    }

    return true
  }

  async logout(userId: string | null) {
    if (!userId) {
      throw new BadRequestException('Invalid JWT')
    }

    const result = await this.tokenService.invalidateRefreshToken(userId)

    if (!result) {
      throw new BadRequestException('Failed to invalidate refresh token')
    }

    return true
  }

  async refreshToken(userId: string | null) {
    if (!userId) {
      throw new BadRequestException('Invalid JWT')
    }

    const { accessToken, refreshToken } = await this.generateTokens(userId)

    const hashedRefreshToken = await argon2.hash(refreshToken)

    const isTokenStored = await this.tokenService.storeRefreshToken(userId, hashedRefreshToken)

    if (!isTokenStored) {
      throw new BadRequestException('Failed to store refresh token')
    }

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

  private async generateTokens(userId: string) {
    const payload = {
      userId: userId,
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
