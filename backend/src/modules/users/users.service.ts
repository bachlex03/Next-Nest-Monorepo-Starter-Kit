import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateUserDto } from '../../api/dtos/users/create-user.dto'
import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'

@Injectable()
export class UsersService {
  constructor(private readonly logger: LoggerExtension) {
    logger.setContext(UsersService.name)
  }

  create(dto: CreateUserDto) {
    // throw new BadRequestException('test')
    this.logger.debug('create user')

    return 'This action adds a new user'
  }

  async findById(id: string) {
    return 'id'
  }

  async findByEmail(email: string) {
    return 'email'
  }

  async getProfile(id: string) {
    return `profile: ${id}`
  }
}
