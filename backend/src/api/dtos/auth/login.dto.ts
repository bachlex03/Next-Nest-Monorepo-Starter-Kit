import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class LoginDto {
  @ApiProperty({
    description: 'The email or username of the user',
    example: 'test@test.com or johndoe',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  identifier: string

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
    required: true,
  })
  @IsString()
  password: string
}
