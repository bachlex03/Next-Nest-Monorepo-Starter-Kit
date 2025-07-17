/* eslint-disable @typescript-eslint/no-floating-promises */

import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import { AppModule } from './app.module'
import swaggerExtension from './api/extensions/swagger'
import { Logger } from '@nestjs/common'
import { HttpExceptionFilter } from './api/common/filters/http-exception.filter'
import { GlobalExceptionFilter } from './api/common/filters/global-exception.filter'
import helmet from 'helmet'
import { TimeExecutingInterceptor } from './api/common/interceptors/time-executing.interceptor'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  const httpAdapter = app.get(HttpAdapterHost)

  const isDevelopment = true

  // Enable CORS
  app.enableCors({
    origin: '*',
  })

  // Enable Helmet
  app.use(helmet())

  // Set global prefix
  app.setGlobalPrefix('api/v1')

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter), new HttpExceptionFilter(httpAdapter))

  // Global interceptors
  if (isDevelopment) {
    app.useGlobalInterceptors(new TimeExecutingInterceptor())
  }

  // Swagger extension
  swaggerExtension(app)

  const port = process.env.PORT ?? 3000
  await app.listen(port)

  logger.log(`Application running on port ${port}`)
}

bootstrap()
