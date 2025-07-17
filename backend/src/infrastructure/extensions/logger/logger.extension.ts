import { ConsoleLogger } from '@nestjs/common'

export class LoggerExtension extends ConsoleLogger {
  constructor() {
    super()
  }

  log(message: string) {
    super.log(message)
  }

  error(message: string, trace: string) {
    super.error(message, trace)
  }

  warn(message: string) {
    super.warn(message)
  }

  debug(message: string) {
    super.debug(message)
  }

  verbose(message: string) {
    super.verbose(message)
  }
}
