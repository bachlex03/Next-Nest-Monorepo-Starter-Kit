import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from '../../api/controllers/auth.controller'
import { LocalStrategy } from './strategies/local.strategy'
import { JwtModule } from '@nestjs/jwt'
import jwtConfig from 'src/infrastructure/configs/jwt/jwt.config'
import { JwtStrategy } from './strategies/jwt.strategy'
import refreshJwtConfig from 'src/infrastructure/configs/jwt/refresh-jwt.config'
import { ConfigModule } from '@nestjs/config'
import { RefreshStrategy } from './strategies/refresh.strategy'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from 'src/api/common/guards/jwt-auth.guard'
import { RolesGuard } from 'src/api/common/guards/roles.guard'

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshStrategy,
    // order matters: JwtAuthGuard must be before RolesGuard
    {
      // order: 1
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply @UseGuards(JwtAuthGuard) to all routes
    },
    {
      // order: 2
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AuthModule {}
