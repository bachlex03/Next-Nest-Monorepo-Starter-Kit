import { Module, Global } from '@nestjs/common'
import { LoggerExtension } from './logger.extension'

@Global()
@Module({
  providers: [LoggerExtension],
  exports: [LoggerExtension],
})
export class LoggerExtensionModule {}
