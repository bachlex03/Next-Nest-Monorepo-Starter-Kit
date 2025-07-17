/* eslint-disable @typescript-eslint/no-floating-promises */

import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import { AppModule } from './app.module'
import swaggerExtension from './api/extensions/swagger'
import { Logger } from '@nestjs/common'
import { HttpExceptionFilter } from './api/common/filters/http-exception.filter'
import { GlobalExceptionFilter } from './api/common/filters/global-exception.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  const httpAdapter = app.get(HttpAdapterHost)

  // Set global prefix
  app.setGlobalPrefix('api/v1')

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter), new HttpExceptionFilter(httpAdapter))

  // Swagger extension
  swaggerExtension(app)

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  logger.log(`Application running on port ${port}`)
}

bootstrap()
