import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { LogoutCommand } from './logout.command'
import { BadRequestException } from '@nestjs/common'
import { TokenService } from 'src/modules/token/token.service'

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly tokenService: TokenService) {}

  async execute(command: LogoutCommand): Promise<boolean> {
    const { userId } = command

    const result = await this.tokenService.invalidateRefreshToken(userId)

    if (!result) {
      throw new BadRequestException('Failed to invalidate refresh token')
    }

    return true
  }
}
