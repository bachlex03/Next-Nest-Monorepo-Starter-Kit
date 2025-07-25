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

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    try {
      return await this.prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { userName: identifier }],
        },
      })
    } catch (error) {
      throw new Error(error)
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      })
    } catch (error) {
      throw new Error(error)
    }
  }

  async findByUsername(userName: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { userName },
      })
    } catch (error) {
      throw new Error(error)
    }
  }
}
