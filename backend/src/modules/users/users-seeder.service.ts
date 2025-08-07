// import { Injectable } from '@nestjs/common'
// import { LoggerExtension } from 'src/infrastructure/extensions/logger/logger.extension'
// import * as bcrypt from 'bcrypt'
// import { users } from 'src/infrastructure/persistence/prisma/seeds/users'
// import { PrismaClient, User } from '@prisma/client'

// @Injectable()
// export class UsersSeederService {
//   private readonly prisma = new PrismaClient()

//   constructor(private readonly logger: LoggerExtension) {
//     this.logger.setContext(UsersSeederService.name)
//   }

//   async seed(): Promise<Array<Promise<User | null>>> {
//     return users.map(async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
//       const hashedPassword = await bcrypt.hash(user.password, 10)

//       return await this.prisma.user
//         .findFirst({
//           where: {
//             email: user.email,
//           },
//         })
//         .then((existingUser) => {
//           if (existingUser) {
//             this.logger.log(`⚠️ User ${user.email} already exists`)

//             return Promise.resolve(null)
//           }

//           return Promise.resolve(
//             this.prisma.user.create({
//               data: {
//                 ...user,
//                 password: hashedPassword,
//               },
//             }),
//           )
//         })
//         .catch((error) => {
//           this.logger.error(`❌ Error seeding user ${user.email}:`, error)

//           return Promise.reject(error)
//         })
//     })
//   }
// }
