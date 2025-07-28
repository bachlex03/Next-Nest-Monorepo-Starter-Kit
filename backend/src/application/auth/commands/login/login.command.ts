import { Command } from '@nestjs/cqrs'
import { LoginDto } from 'src/api/dtos/auth/login.dto'
import { LoginResponse } from 'src/shared/contracts/responses/auth/login.response'

export class LoginCommand extends Command<LoginResponse> {
  constructor(public readonly dto: LoginDto) {
    super()
  }
}
