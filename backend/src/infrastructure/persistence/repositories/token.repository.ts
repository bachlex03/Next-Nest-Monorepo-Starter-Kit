import { Injectable } from '@nestjs/common'
import BaseRepository from './base.repository'
import { Token } from '@prisma/client'
import { PrismaInit } from '../prisma/init'

@Injectable()
export default class TokenRepository extends BaseRepository<Token> {
  constructor(protected readonly prisma: PrismaInit) {
    super(prisma, 'token')
  }

  async storeRefreshToken(userId: string, refreshToken: string) {
    return await this.prisma.token.create({
      data: { userId, refreshToken },
    })
  }

  async validateRefreshToken(userId: string) {
    return await this.prisma.token.update({
      where: { userId },
      data: { refreshToken: null },
    })
  }

  async findByUserId(userId: string): Promise<Token | null> {
    try {
      return await this.prisma.token.findUnique({
        where: {
          userId,
        },
      })
    } catch (error) {
      throw new Error(error)
    }
  }
}
