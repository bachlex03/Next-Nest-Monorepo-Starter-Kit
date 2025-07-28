import { Controller, Post, Body, BadRequestException, UseGuards, Req, Get } from '@nestjs/common'
import { UsersService } from 'src/modules/users/users.service'
import { ApiBearerAuth } from '@nestjs/swagger'
import { Public } from '../common/decorators/public.decorator'
import { QueryBus } from '@nestjs/cqrs'
import { GetMeQuery } from 'src/application/users/queries/get-me.query'

@Controller('users')
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly usersService: UsersService,
  ) {}

  // @Public()
  // @Get()
  // findAll() {
  //   return this.usersService.findAll()
  // }

  @Get('me')
  getMe(@Req() req) {
    return this.queryBus.execute(new GetMeQuery(req.user.id))
  }
}
