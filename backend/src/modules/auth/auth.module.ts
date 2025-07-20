import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from '../../api/controllers/auth.controller'
import { LocalStrategy } from './strategies/local.strategy'
import { JwtModule } from '@nestjs/jwt'
import jwtConfig from 'src/infrastructure/configs/jwt.config'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [JwtModule.registerAsync(jwtConfig.asProvider())],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
