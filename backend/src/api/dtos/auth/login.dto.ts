import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com',
    required: true,
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
    required: true,
  })
  @IsString()
  password: string
}
