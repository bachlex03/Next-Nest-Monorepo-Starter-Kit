import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsString, Length } from 'class-validator'

export class RegisterDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@test.com',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
  })
  @IsString()
  @Length(3, 30, { message: 'Username must be between 3 and 30 characters' })
  @Transform(({ value }) => value.trim())
  userName: string

  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
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
