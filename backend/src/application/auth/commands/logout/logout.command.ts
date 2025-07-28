import { Command } from '@nestjs/cqrs'

export class LogoutCommand extends Command<boolean> {
  constructor(public readonly userId: string) {
    super()
  }
}
