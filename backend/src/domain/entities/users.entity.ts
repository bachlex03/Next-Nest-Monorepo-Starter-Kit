import { User } from '@prisma/client'

export class UserEntity implements User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date

  constructor(partial: Partial<User>) {
    Object.assign(this, partial)
  }

  static toEntity(partial: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): UserEntity {
    return new UserEntity(partial)
  }
}
