import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'

import { AuthService } from 'src/modules/auth/auth.service'
import { LoginDto } from 'src/api/dtos/auth/login.dto'
import { Public } from 'src/api/common/decorators/public.decorator'
import { LocalAuthGuard } from 'src/api/common/guards/local-auth.guard'
import { RefreshAuthGuard } from 'src/api/common/guards/refresh-auth.guard'
import { ApiBearerAuth } from '@nestjs/swagger'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req, @Body() dto: LoginDto) {
    console.log('login', req.user)
    return this.authService.login()
  }

  @ApiBearerAuth()
  @Post('logout')
  async logout(@Req() req) {
    console.log('logout', req.user)
    return this.authService.logout()
  }

  @UseGuards(RefreshAuthGuard)
  @Public() // skip JwtAuthGuard
  @ApiBearerAuth()
  @Post('refresh')
  async refresh(@Req() req) {
    console.log('refresh', req.user)
    return this.authService.refreshToken()
  }
}
