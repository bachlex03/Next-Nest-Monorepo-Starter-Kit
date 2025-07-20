/* eslint-disable @typescript-eslint/no-floating-promises */

import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import helmet from 'helmet'
import * as compression from 'compression'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import swaggerExtension from './api/extensions/swagger'
import { HttpExceptionFilter } from './api/common/filters/http-exception.filter'
import { GlobalExceptionFilter } from './api/common/filters/global-exception.filter'
import { TimeExecutingInterceptor } from './api/common/interceptors/time-executing.interceptor'
import { DtoValidationPine } from './api/common/pipes/dto-validation.pipe'
import { PayloadLoggingPipe } from './api/common/pipes/payload-logging.pipe'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  const httpAdapter = app.get(HttpAdapterHost)

  const isDevelopment = process.env.NODE_ENV === 'development'

  // Enable CORS
  app.enableCors({
    origin: '*',
  })
  // Enable Helmet
  app.use(helmet())

  // Compression reduce the size of the response body and increase the speed of a web app
  app.use(compression())

  // Set global prefix
  app.setGlobalPrefix('api/v1')

  // Global validation pipe - using custom validation for better error responses
  app.useGlobalPipes(new DtoValidationPine())

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapter), new HttpExceptionFilter(httpAdapter))

  // Global interceptors
  if (isDevelopment) {
    app.useGlobalPipes(new PayloadLoggingPipe())
    app.useGlobalInterceptors(new TimeExecutingInterceptor())
  }

  // Swagger extension
  swaggerExtension(app)

  await app.listen(process.env.PORT as string)

  logger.debug(`🚀 This application is running on: ${await app.getUrl()}`)
  logger.debug(`📚 Swagger documentation: ${await app.getUrl()}/api-docs`)
  logger.debug(`🔧 Environment: ${process.env.NODE_ENV}`)
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
