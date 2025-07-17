import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EmrFormModule } from './modules/emr-form/emr-form.module'
import { UsersModule } from './modules/users/users.module'
import { LoggerMiddleware } from './api/common/middlewares/logger.middleware'
import { LoggerExtensionModule } from './infrastructure/extensions/logger/logger.module'

@Module({
  imports: [EmrFormModule, UsersModule, LoggerExtensionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path')
  }
}
