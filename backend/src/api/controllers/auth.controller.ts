import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'

import { AuthService } from 'src/modules/auth/auth.service'
import { LoginDto } from 'src/api/dtos/auth/login.dto'
import { Public } from 'src/api/common/decorators/public.decorator'
import { LocalAuthGuard } from 'src/api/common/guards/local-auth.guard'
import { RefreshAuthGuard } from 'src/api/common/guards/refresh-auth.guard'
import { ApiBearerAuth } from '@nestjs/swagger'
import { RegisterDto } from 'src/api/dtos/auth/register.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(@Req() req) {
    return this.authService.logout(req.user.id)
  }

  @UseGuards(RefreshAuthGuard)
  @Public() // skip JwtAuthGuard
  @ApiBearerAuth()
  @Post('refresh')
  refresh(@Req() req) {
    return this.authService.refreshToken(req.user.id)
  }
}
