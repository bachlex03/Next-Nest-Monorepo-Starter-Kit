import { Command } from '@nestjs/cqrs'
import { RegisterDto } from 'src/api/dtos/auth/register.dto'

export class RegisterCommand extends Command<boolean> {
  constructor(public readonly dto: RegisterDto) {
    super()
  }
}
