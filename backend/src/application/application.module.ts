import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { AuthCqrsModule } from './auth/auth-cqrs.module'
import { UsersCqrsModule } from './users/users-cqrs.module'

@Module({
  imports: [CqrsModule.forRoot(), AuthCqrsModule, UsersCqrsModule],
})
export class ApplicationModule {}
