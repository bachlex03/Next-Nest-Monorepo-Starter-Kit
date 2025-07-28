import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { GetMeQuery } from './get-me.query'
import { GetMeResponse } from 'src/shared/contracts/responses/users/get-me.response'
import { UsersService } from 'src/modules/users/users.service'

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery> {
  constructor(private readonly userService: UsersService) {}

  async execute(query: GetMeQuery): Promise<GetMeResponse> {
    const { userId } = query

    const user = (await this.userService.findById(userId))!

    return {
      email: user.email,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
    }
  }
}
