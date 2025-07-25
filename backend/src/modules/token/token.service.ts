import { Injectable } from '@nestjs/common'

import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'
import TokenRepository from 'src/infrastructure/persistence/repositories/token.repository'

@Injectable()
export class TokenService {
  constructor(
    private readonly logger: LoggerExtension,
    private readonly tokenRepository: TokenRepository,
  ) {
    logger.setContext(TokenService.name)
  }

  async findByUserId(userId: string) {
    return await this.tokenRepository.findByUserId(userId)
  }

  async storeRefreshToken(userId: string, hashedRefreshToken: string) {
    const result = await this.tokenRepository.storeRefreshToken(userId, hashedRefreshToken)

    return !!result
  }

  async invalidateRefreshToken(userId: string) {
    const result = await this.tokenRepository.validateRefreshToken(userId)

    return !!result
  }
}
