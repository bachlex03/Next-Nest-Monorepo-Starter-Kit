import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsString } from 'class-validator'

export class RegisterDto {
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

  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  public readonly firstName: string

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  @IsString()
  @Transform(({ value }) => value.trim())
  public readonly lastName: string
}
