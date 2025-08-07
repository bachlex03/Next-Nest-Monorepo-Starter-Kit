import { Injectable } from '@nestjs/common'
import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'
import { PrismaInit } from 'src/infrastructure/persistence/prisma/init'
import * as bcrypt from 'bcrypt'
import { users } from 'src/infrastructure/persistence/prisma/seeds/users'
import { User } from '@prisma/client'

@Injectable()
export class UsersSeederService {
  constructor(
    private readonly logger: LoggerExtension,
    private readonly prisma: PrismaInit,
  ) {
    this.logger.setContext(UsersSeederService.name)
  }

  async seed(): Promise<Array<Promise<User | null>>> {
    return users.map(async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
      const hashedPassword = await bcrypt.hash(user.password, 10)

      return await this.prisma.user
        .findFirst({
          where: {
            email: user.email,
          },
        })
        .then((existingUser) => {
          if (existingUser) {
            this.logger.log(`⚠️ User ${user.email} already exists`)

            return Promise.resolve(null)
          }

          return Promise.resolve(
            this.prisma.user.create({
              data: {
                ...user,
                password: hashedPassword,
              },
            }),
          )
        })
        .catch((error) => {
          this.logger.error(`❌ Error seeding user ${user.email}:`, error)

          return Promise.reject(error)
        })
    })
  }
}
