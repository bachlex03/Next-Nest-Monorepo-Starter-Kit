/* eslint-disable @typescript-eslint/no-floating-promises */

import { NestFactory, HttpAdapterHost } from '@nestjs/core'
import helmet from 'helmet'
import * as compression from 'compression'
import { Logger } from '@nestjs/common'

import { AppModule } from 'src/app.module'
import swaggerExtension from 'src/api/extensions/swagger'
import { HttpExceptionFilter } from 'src/api/common/filters/http-exception.filter'
import { GlobalExceptionFilter } from 'src/api/common/filters/global-exception.filter'
import { TimeExecutingInterceptor } from 'src/api/common/interceptors/time-executing.interceptor'
import { DtoValidationPine } from 'src/api/common/pipes/dto-validation.pipe'
import { PayloadLoggingPipe } from 'src/api/common/pipes/payload-logging.pipe'
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module'
import { Seeder } from './infrastructure/persistence/prisma/seeder'

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })

  const connectionString = `${process.env.DATABASE_URL}`
  console.log(connectionString)
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

  NestFactory.createApplicationContext(PrismaModule).then((appContext) => {
    const seeder = appContext.get(Seeder)

    seeder
      .seed()
      .then(() => {
        logger.log('Database seeded successfully')
      })
      .catch((error) => {
        logger.error('Error seeding database', error)

        throw error
      })
      .finally(() => {
        appContext.close()
      })
  })

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
