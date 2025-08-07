import { Module } from '@nestjs/common'
import { PrismaInit } from './init'
import { Seeder } from './seeder'
import { LoggerExtensionModule } from 'src/infrastructure/extensions/logger/logger.module'

@Module({
  imports: [LoggerExtensionModule],
  providers: [PrismaInit, Seeder],
  exports: [PrismaInit],
})
export class PrismaModule {}
