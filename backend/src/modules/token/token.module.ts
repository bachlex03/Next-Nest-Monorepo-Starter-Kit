import { Module } from '@nestjs/common'
import { PersistenceModule } from 'src/infrastructure/persistence/persistence.module'
import { TokenService } from './token.service'

@Module({
  imports: [PersistenceModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
