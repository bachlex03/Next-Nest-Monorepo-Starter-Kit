import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'

import { AppController } from './app.controller'
import { AppService } from './app.service'
import { LoggerMiddleware } from './api/common/middlewares/logger.middleware'
import { LoggerExtensionModule } from 'src/infrastructure/extensions/logger/logger.module'
import { RateLimitingFactory } from 'src/api/extensions/rate-limiting'
import { UsersModule } from 'src/modules/users/users.module'
import { AuthModule } from 'src/modules/auth/auth.module'
import { configuration } from 'src/infrastructure/configs/env/env.config'
import { envValidationSchema } from 'src/infrastructure/configs/env/validation'
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module'

@Module({
  imports: [
    // Infrastructure modules
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
      load: [configuration],
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      useClass: RateLimitingFactory,
    }),
    LoggerExtensionModule,

    // Application modules
    UsersModule,
    AuthModule,

    // Persistence modules
    PersistenceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Throttler guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path')
  }
}
