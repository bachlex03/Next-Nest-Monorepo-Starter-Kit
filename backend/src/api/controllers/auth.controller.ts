import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { AuthService } from '../../modules/auth/auth.service'
import { LoginDto } from '../dtos/auth/login.dto'
import { LocalAuthGuard } from '../common/guards/local-auth.guard'
import { RefreshAuthGuard } from '../common/guards/refresh-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req, @Body() dto: LoginDto) {
    const tokenPair = this.authService.login()

    return {
      id: req.user,
      accessToken: tokenPair,
    }
  }

  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refresh(@Req() req) {
    return this.authService.refreshToken(req.user.id)
  }
}
