import { forwardRef, Module } from '@nestjs/common'

import { UsersController } from 'src/api/controllers/users.controller'
import { UsersService } from './users.service'
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module'
import { UsersSeederService } from './users-seeder.service'
import { PrismaModule } from 'src/infrastructure/persistence/prisma/prisma.module'
import { CqrsModule } from '@nestjs/cqrs'

@Module({
  imports: [CqrsModule, PrismaModule, forwardRef(() => PersistenceModule)],
  controllers: [UsersController],
  providers: [UsersService, UsersSeederService],
  exports: [UsersService, UsersSeederService],
})
export class UsersModule {}
