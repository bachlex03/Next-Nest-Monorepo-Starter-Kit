/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import swaggerExtension from './api/extensions/swagger'
import { Logger } from '@nestjs/common'
import { LoggerExtension } from './infrastructure/extensions/logger/logger.extension'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  // Set global prefix
  app.setGlobalPrefix('api/v1')

  app.useLogger(app.get(LoggerExtension))

  // Swagger extension
  swaggerExtension(app)

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  logger.log(`Application running on port ${port}`)
}

bootstrap()
