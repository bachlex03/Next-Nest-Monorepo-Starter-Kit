import { Controller, Post, Body, BadRequestException } from '@nestjs/common'
import { CreateUserDto } from 'src/api/dtos/users/create-user.dto'
import { UsersService } from 'src/modules/users/users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }
}
