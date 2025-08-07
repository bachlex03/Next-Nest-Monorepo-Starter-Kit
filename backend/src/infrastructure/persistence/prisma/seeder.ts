import { Injectable } from '@nestjs/common'
import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'
import { PrismaClient, User } from '@prisma/client'
import { userSeeds } from './seeds/users'
import * as bcrypt from 'bcrypt'

@Injectable()
export class Seeder {
  private readonly prisma = new PrismaClient()

  constructor(private readonly logger: LoggerExtension) {
    this.logger.setContext(Seeder.name)
  }

  async seed() {
    this.logger.log('🌱 Starting database seeding...')

    try {
      await this.seedUsers()
        .then((completed) => {
          this.logger.log('✅ Users seeded successfully!')

          Promise.resolve(completed)
        })
        .catch((error) => {
          this.logger.error('❌ Error during users seeding:', error)

          Promise.reject(error)
        })

      this.logger.log('✅ Database seeding completed successfully!')
    } catch (error) {
      this.logger.error('❌ Error during seeding:', error)
    } finally {
      await this.prisma.$disconnect()
    }
  }

  private async seedUsers() {
    const users = await this.prisma.user.count()

    if (users > 0) {
      this.logger.log('👥 Exists users, skipping seeding...')
      return
    }

    const userPromises: Array<Promise<User | null>> = userSeeds.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10)

      return await this.prisma.user.create({
        data: {
          ...user,
          password: hashedPassword,
        },
      })
    })

    return await Promise.all(userPromises)
  }
}
