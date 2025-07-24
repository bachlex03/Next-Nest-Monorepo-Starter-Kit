import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import UserRepository from './repositories/user.repository'
import TokenRepository from './repositories/token.repository'

@Module({
  imports: [PrismaModule],
  providers: [UserRepository, TokenRepository],
  exports: [UserRepository, TokenRepository],
})
export class PersistenceModule {}
