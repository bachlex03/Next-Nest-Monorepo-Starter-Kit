import { Controller, Post, Body, BadRequestException, UseGuards, Req, Get } from '@nestjs/common'
import { CreateUserDto } from 'src/api/dtos/users/create-user.dto'
import { UsersService } from 'src/modules/users/users.service'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Public } from '../common/decorators/public.decorator'

@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  // @Public()
  // @Post()
  // create(@Req() req, @Body() dto: CreateUserDto) {
  //   return this.usersService.create(dto)
  // }
}
