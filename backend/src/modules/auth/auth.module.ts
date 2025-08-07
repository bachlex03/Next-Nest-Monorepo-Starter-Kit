import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'

import { JwtAuthGuard } from 'src/api/common/guards/jwt-auth.guard'
import { RolesGuard } from 'src/api/common/guards/roles.guard'
import AccessTokenJwtConfig from 'src/infrastructure/configs/jwt/at-jwt.config'
import RefreshTokenJwtConfig from 'src/infrastructure/configs/jwt/rt-jwt.config'
import GoogleOAuthConfig from 'src/infrastructure/configs/auth/google-oauth.config'
import { AuthController } from 'src/api/controllers/auth.controller'
import { AuthService } from './auth.service'
import { LocalStrategy } from './strategies/local.strategy'
import { JwtStrategy } from './strategies/jwt.strategy'
import { RefreshStrategy } from './strategies/refresh.strategy'
import { UsersModule } from '../users/users.module'
import { TokenModule } from '../token/token.module'
import { GoogleStrategy } from './strategies/google.strategy'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [
    CqrsModule,
    JwtModule.registerAsync(AccessTokenJwtConfig.asProvider()),
    ConfigModule.forFeature(AccessTokenJwtConfig),
    ConfigModule.forFeature(RefreshTokenJwtConfig),
    ConfigModule.forFeature(GoogleOAuthConfig),
    PassportModule,
    UsersModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Passport Strategies
    LocalStrategy,
    JwtStrategy,
    RefreshStrategy,
    GoogleStrategy,
    // order matters: JwtAuthGuard must be before RolesGuard
    {
      // order must be 1
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply @UseGuards(JwtAuthGuard) to all routes
    },
    {
      // order must be 2
      provide: APP_GUARD,
      useClass: RolesGuard, // Apply @UseGuards(RolesGuard) to all routes
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
