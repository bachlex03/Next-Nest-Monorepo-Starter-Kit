import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

const swaggerExtension = (app: INestApplication) => {
  const swaggerUrl = '/api-docs'

  const builder = new DocumentBuilder()
    .setTitle('Furniture exchange API')
    .setDescription('API for furniture exchange')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const documentFactory = SwaggerModule.createDocument(app, builder)

  SwaggerModule.setup(swaggerUrl, app, documentFactory, {
    jsonDocumentUrl: 'api-docs/json',
  })
}

export default swaggerExtension
