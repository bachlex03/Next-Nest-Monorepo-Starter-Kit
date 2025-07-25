import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'
import { RegisterDto } from 'src/api/dtos/auth/register.dto'
import { CreateUserDto } from 'src/api/dtos/users/create-user.dto'

import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'
import UserRepository from 'src/infrastructure/persistence/repositories/user.repository'
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

  async create(dto: RegisterDto): Promise<User> {
    // Handle both CreateUserDto and registration data
    const data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      email: dto.email,
      userName: dto.userName,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    }
    // Create the user in the database
    const user = await this.repository.create(data)
    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findByEmail(email)
  }

  async findByUsername(userName: string): Promise<User | null> {
    return await this.repository.findByUsername(userName)
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return await this.repository.findByEmailOrUsername(identifier)
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findById(id)
  }
}
