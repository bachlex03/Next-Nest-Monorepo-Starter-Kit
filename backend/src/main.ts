/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import swaggerExtension from './controllers/extensions/swagger'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Set global prefix
  app.setGlobalPrefix('api/v1')

  // Swagger extensions
  swaggerExtension(app)

  await app.listen(process.env.PORT ?? 3000)
}

bootstrap()
