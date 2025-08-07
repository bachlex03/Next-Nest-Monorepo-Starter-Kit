import { forwardRef, Module } from '@nestjs/common'
import { PrismaInit } from './init'
import { Seeder } from './seeder'
import { UsersModule } from 'src/modules/users/users.module'
import { LoggerExtensionModule } from 'src/infrastructure/extensions/logger/logger.module'

@Module({
  imports: [forwardRef(() => UsersModule), LoggerExtensionModule],
  providers: [PrismaInit, Seeder],
  exports: [PrismaInit],
})
export class PrismaModule {}
