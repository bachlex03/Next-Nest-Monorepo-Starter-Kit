import { Injectable } from '@nestjs/common'
import { UsersSeederService } from 'src/modules/users/users-seeder.service'
import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'

@Injectable()
export class Seeder {
  constructor(
    private readonly logger: LoggerExtension,
    private readonly userSeederService: UsersSeederService,
  ) {
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
    }
  }

  async seedUsers() {
    this.logger.log('👥 Seeding users...')

    const userPromises = await this.userSeederService.seed()

    return await Promise.all(userPromises)
  }
}
