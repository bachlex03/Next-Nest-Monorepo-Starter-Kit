import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { AuthService } from 'src/modules/auth/auth.service'
import { LoginDto } from 'src/api/dtos/auth/login.dto'
import { Public } from 'src/api/common/decorators/public.decorator'
import { LocalAuthGuard } from 'src/api/common/guards/local-auth.guard'
import { RefreshAuthGuard } from 'src/api/common/guards/refresh-auth.guard'
import { RegisterDto } from 'src/api/dtos/auth/register.dto'
import { GoogleAuthGuard } from 'src/api/common/guards/google-oauth.guard'
import { CommandBus } from '@nestjs/cqrs'
import { LoginCommand } from 'src/application/auth/commands/login/login.command'
import { RegisterCommand } from 'src/application/auth/commands/register/register.command'
import { LogoutCommand } from 'src/application/auth/commands/logout/logout.command'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.commandBus.execute(new LoginCommand(dto))
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.commandBus.execute(new RegisterCommand(dto))
  }

  @UseGuards(RefreshAuthGuard)
  @Public() // skip JwtAuthGuard
  @ApiBearerAuth()
  @Post('logout')
  logout(@Req() req) {
    return this.commandBus.execute(new LogoutCommand(req.user.id))
  }

  @UseGuards(RefreshAuthGuard)
  @Public() // skip JwtAuthGuard
  @ApiBearerAuth()
  @Post('refresh')
  refresh(@Req() req) {
    return this.authService.refreshToken(req.user.id)
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('oauth/google/login')
  googleLogin() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('oauth/google/callback')
  async googleCallback(@Req() req, @Res() res) {
    const response = await this.authService.googleLogin(req.user.email)

    res.redirect(`http://localhost:4000?token=${response.accessToken}`)
  }
}
