import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from '../../api/controllers/auth.controller'
import { LocalStrategy } from './strategies/local.strategy'

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
