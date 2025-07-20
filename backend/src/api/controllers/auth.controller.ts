import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from '../../modules/auth/auth.service'
import { LoginDto } from '../dtos/auth/login.dto'
import { Request } from 'express'
import { LocalAuthGuard } from '../common/guards/local-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    return req.user
  }
}
