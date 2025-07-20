import { Controller, Post, Body, BadRequestException, UseGuards, Req, Get } from '@nestjs/common'
import { CreateUserDto } from 'src/api/dtos/users/create-user.dto'
import { UsersService } from 'src/modules/users/users.service'
import { ApiBearerAuth } from '@nestjs/swagger'

@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateUserDto) {
    console.log('create', req.user)
    return this.usersService.create(dto)
  }

  @Get('profile')
  getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.id)
  }
}
