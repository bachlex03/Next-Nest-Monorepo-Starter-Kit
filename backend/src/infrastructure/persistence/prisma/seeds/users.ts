import { User } from '@prisma/client'

export const users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    email: 'admin@example.com',
    userName: 'admin',
    password: 'p@ssw0rd_!',
    firstName: 'Admin',
    lastName: 'User',
  },
]
