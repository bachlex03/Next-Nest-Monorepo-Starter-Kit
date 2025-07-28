import { AggregateRoot } from '@nestjs/cqrs'
import { User } from '@prisma/client'
import { UserCreatedDomainEvent } from './events/user-created.domain-event'

export class UserEntity extends AggregateRoot implements User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  userName: string
  createdAt: Date
  updatedAt: Date

  constructor(partial: Partial<User>) {
    super()
    this.autoCommit = true
    Object.assign(this, partial)
  }

  static toEntity(partial: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): UserEntity {
    return new UserEntity(partial)
  }

  userCreated() {
    this.apply(new UserCreatedDomainEvent(this.email, this.userName, this.firstName, this.lastName))
  }
}
