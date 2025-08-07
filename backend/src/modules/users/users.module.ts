import { Module } from '@nestjs/common'

import { UsersController } from 'src/api/controllers/users.controller'
import { UsersService } from './users.service'
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule, PersistenceModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
