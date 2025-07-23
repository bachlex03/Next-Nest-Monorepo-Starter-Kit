import { Injectable } from '@nestjs/common'
import BaseRepository from './base.repository'
import { Prisma, User } from '@prisma/client'
import { PrismaInit } from '../prisma/init'

@Injectable()
export default class UserRepository extends BaseRepository<User> {
  constructor(protected readonly prisma: PrismaInit) {
    super(prisma, 'user')
  }

  async findAllByFilter(options: Prisma.UserFindManyArgs): Promise<User[]> {
    try {
      return await this.prisma.user.findMany(options)
    } catch (error) {
      throw new Error(error)
    }
  }
}
