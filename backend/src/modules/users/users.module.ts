import { Module } from '@nestjs/common'

import { UsersController } from 'src/api/controllers/users.controller'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
