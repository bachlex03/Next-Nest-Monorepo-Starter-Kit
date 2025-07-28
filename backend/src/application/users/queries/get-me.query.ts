import { Query } from '@nestjs/cqrs'
import { GetMeResponse } from 'src/shared/contracts/responses/users/get-me.response'

export class GetMeQuery extends Query<GetMeResponse> {
  constructor(public readonly userId: string) {
    super()
  }
}
