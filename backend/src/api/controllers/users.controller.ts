import { Controller, Post, Body, BadRequestException, UseGuards, Req, Get } from '@nestjs/common'
import { CreateUserDto } from 'src/api/dtos/users/create-user.dto'
import { UsersService } from 'src/modules/users/users.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.id)
  }
}
