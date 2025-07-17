import { BadRequestException, Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'

@Injectable()
export class UsersService {
  constructor(private readonly logger: LoggerExtension) {
    // logger.setContext(UsersService.name)
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user'
  }

  findAll() {
    this.logger.warn('About to return users!')

    throw new Error('test')
    throw new BadRequestException('test')

    return 'This action returns all users'
  }

  findOne(id: number) {
    return `This action returns a #${id} user`
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`
  }

  remove(id: number) {
    return `This action removes a #${id} user`
  }
}
