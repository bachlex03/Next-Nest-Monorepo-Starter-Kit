import { Injectable } from '@nestjs/common'
import { User } from '@prisma/client'

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

  // async create(dto: any) {
  //   const newUser = {
  //     email: 'lov3rinve146@gmail.com',
  //     password: '123456',
  //     fullName: 'John Doe',
  //   } as User

  //   const result = await this.repository.create(newUser)

  //   return result
  // }
}
