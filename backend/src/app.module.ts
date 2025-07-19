import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './modules/users/users.module'
import { LoggerMiddleware } from './api/common/middlewares/logger.middleware'
import { LoggerExtensionModule } from './infrastructure/extensions/logger/logger.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { RateLimitingFactory } from './api/extensions/rate-limiting'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './modules/auth/auth.module'
import { ConfigModule } from '@nestjs/config'
import { configuration } from './infrastructure/config/env/env.config'
import { envValidationSchema } from './infrastructure/config/env/validation'

@Module({
  imports: [
    // Infrastructure modules
    LoggerExtensionModule,
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
      load: [configuration],
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      useClass: RateLimitingFactory,
    }),

    // Application modules
    UsersModule,

    AuthModule,
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
