import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { EmrFormModule } from './modules/emr-form/emr-form.module'
import { UsersModule } from './modules/users/users.module'

@Module({
  imports: [EmrFormModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
