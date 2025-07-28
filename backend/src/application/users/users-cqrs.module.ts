import { Module } from '@nestjs/common'
import { UsersModule } from 'src/modules/users/users.module'
import { GetMeHandler } from './queries/get-me.handler'

@Module({
  imports: [UsersModule],
  providers: [GetMeHandler],
})
export class UsersCqrsModule {}
