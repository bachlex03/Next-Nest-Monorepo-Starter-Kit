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

@Module({
  imports: [
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, RefreshStrategy],
})
export class AuthModule {}
