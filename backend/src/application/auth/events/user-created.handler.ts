import { EventsHandler, IEventHandler } from '@nestjs/cqrs'
import { UserCreatedDomainEvent } from 'src/domain/entities/user/events/user-created.domain-event'

@EventsHandler(UserCreatedDomainEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedDomainEvent> {
  constructor() {}

  handle(event: UserCreatedDomainEvent) {
    // business logic
    // send email to new user

    try {
      console.log('event', event)
    } catch (error) {
      throw new Error(error)
    }
  }
}
