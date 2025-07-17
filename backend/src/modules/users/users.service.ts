import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateUserDto } from '../../api/dtos/users/create-user.dto'
import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'

@Injectable()
export class UsersService {
  constructor(private readonly logger: LoggerExtension) {}

  create(dto: CreateUserDto) {
    // throw new BadRequestException('test')

    return 'This action adds a new user'
  }
}
