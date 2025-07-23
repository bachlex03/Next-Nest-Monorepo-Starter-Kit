import { Module } from '@nestjs/common'

import { UsersController } from 'src/api/controllers/users.controller'
import { UsersService } from './users.service'
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module'

@Module({
  imports: [PersistenceModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
