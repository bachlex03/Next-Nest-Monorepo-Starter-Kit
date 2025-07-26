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
import { User } from '@prisma/client'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
    @Inject(RefreshTokenJwtConfig.KEY) private refreshTokenConfig: ConfigType<typeof RefreshTokenJwtConfig>,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmailOrUsername(dto.identifier)

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
    const isUserExist = await this.userService.findByEmailOrUsername(dto.email)

    if (isUserExist) {
      throw new BadRequestException('User already exists')
    }

    // Check if username is already taken
    const isUsernameTaken = await this.userService.findByUsername(dto.userName)
    if (isUsernameTaken) {
      throw new BadRequestException('Username already taken')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const newUser = UserEntity.toEntity({
      email: dto.email,
      userName: dto.userName,
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
  async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findByEmail(email)

    if (!user) throw new UnauthorizedException('User not found!')

    const isPasswordMatch = await bcrypt.compare(password, user.password)

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...userWithoutPassword } = user

    return userWithoutPassword
  }

  // JWT Strategy
  async validateJwtUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findById(userId)

    if (!user) throw new UnauthorizedException('User not found!')

    const { password: _, ...userWithoutPassword } = user

    return userWithoutPassword
  }

  // Refresh Strategy
  async validateRefreshToken(userId: string, refreshToken: string): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findById(userId)

    if (!user) throw new UnauthorizedException('Invalid Refresh Token')

    const rfToken = await this.tokenService.findByUserId(userId)

    if (!rfToken || !rfToken.refreshToken) throw new UnauthorizedException('Invalid Refresh Token')

    const isRefreshTokenValid = await argon2.verify(rfToken.refreshToken, refreshToken)

    if (!isRefreshTokenValid) throw new UnauthorizedException('Invalid Refresh Token')

    const { password: _, ...userWithoutPassword } = user

    return userWithoutPassword
  }

  // Google Strategy
  async validateGoogleUser(googleProfile: { email: string; firstName: string; lastName: string; avatarUrl: string }) {
    const user = await this.userService.findByEmail(googleProfile.email)
    if (user) return user

    const newUser = UserEntity.toEntity({
      email: googleProfile.email,
      userName: googleProfile.email,
      password: '',
      firstName: googleProfile.firstName,
      lastName: googleProfile.lastName,
    })

    return await this.userService.create(newUser)
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
