import { Module } from '@nestjs/common'
import { PrismaInit } from './init'

@Module({
  providers: [PrismaInit],
  exports: [PrismaInit],
})
export class PrismaModule {}
