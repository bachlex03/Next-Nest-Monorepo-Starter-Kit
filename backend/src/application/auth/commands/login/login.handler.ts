import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as argon2 from 'argon2'

import { LoginCommand } from './login.command'
import { LoginResponse } from 'src/shared/contracts/responses/auth/login.response'
import { TokenService } from 'src/modules/token/token.service'
import { UsersService } from 'src/modules/users/users.service'
import { AuthService } from 'src/modules/auth/auth.service'

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const { dto } = command

    const user = await this.userService.findByEmailOrUsername(dto.identifier)

    if (!user) {
      throw new UnauthorizedException('User not found!')
    }

    const isPasswordMatch = await bcrypt.compare(dto.password, user.password)

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { accessToken, refreshToken } = await this.authService.generateTokens(user.id)

    const hashedRefreshToken = await argon2.hash(refreshToken)

    const isTokenStored = await this.tokenService.storeRefreshToken(user.id, hashedRefreshToken)

    if (!isTokenStored) {
      throw new BadRequestException('Failed to store refresh token')
    }

    return {
      accessToken,
      refreshToken,
    }
  }
}
