import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { BadRequestException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { UsersService } from 'src/modules/users/users.service'
import { RegisterCommand } from './register.command'
import { UserEntity } from 'src/domain/entities/users.entity'

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(private readonly userService: UsersService) {}

  async execute(command: RegisterCommand): Promise<boolean> {
    const { dto } = command

    const isUserExist = await this.userService.findByEmailOrUsername(dto.email)

    if (isUserExist) {
      throw new BadRequestException('User already exists')
    }

    const isUsernameTaken = await this.userService.findByUsername(dto.userName)
    if (isUsernameTaken) {
      throw new BadRequestException('Username already taken')
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10)

    const newUser = UserEntity.toEntity({
      email: dto.email,
      userName: dto.userName,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
    })

    const result = await this.userService.create(newUser)

    if (!result) {
      throw new BadRequestException('Failed to create user')
    }

    return true
  }
}
