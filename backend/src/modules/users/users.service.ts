import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { CreateUserDto } from 'src/api/dtos/users/create-user.dto'
import { UserEntity } from 'src/domain/entities/users.entity'

import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'
import UserRepository from 'src/infrastructure/persistence/repositories/user.repository'
import { TokenService } from '../token/token.service'
@Injectable()
export class UsersService {
  constructor(
    private readonly logger: LoggerExtension,
    private readonly repository: UserRepository,
  ) {
    logger.setContext(UsersService.name)
  }

  async findAll() {
    return await this.repository.findAllByFilter({
      where: {},
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findUniqueByFilter({
      where: {
        email,
      },
    })
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findUniqueByFilter({
      where: {
        id,
      },
    })
  }

  async create(entity: UserEntity): Promise<User> {
    const result = await this.repository.create(entity)

    return result
  }
}
