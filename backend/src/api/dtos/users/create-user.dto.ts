import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsEmail,
  IsInt,
  Min,
  Max,
  Length,
  IsDate,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsUrl,
  ValidateIf,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class CreateUserDto {
  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  @IsString()
  @Length(2, 30, { message: 'Name must be between 2 and 30 characters' })
  @Transform(({ value }) => value.trim())
  public readonly name: string

  @ApiProperty({
    description: 'The email of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  public readonly email: string

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
  })
  @IsString()
  @Length(8, 50, { message: 'Password must be between 8 and 50 characters' })
  // @IsValidPassword() // custom validator
  public readonly password: string

  @ApiProperty({
    description: 'The age of the user',
    example: 25,
  })
  @IsInt()
  @Min(18, { message: 'Age must be at least 18' })
  @Max(100, { message: 'Age must not exceed 100' })
  public readonly age: number

  @ApiProperty({
    description: 'The date of birth of the user',
    example: '1990-01-01',
  })
  @IsDate({ message: 'Invalid date format' })
  @Type(() => Date)
  public readonly dateOfBirth: Date

  @ApiProperty({
    description: 'The photos of the user',
    example: [
      {
        name: 'Photo 1',
        description: 'Description of Photo 1',
        size: 1024,
        url: 'https://example.com/photo1.jpg',
      },
      {
        name: 'Photo 2',
        description: 'Description of Photo 2',
        size: 2048,
        url: 'https://example.com/photo2.jpg',
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Photos array should not be empty' })
  @ValidateNested({ each: true })
  @Type(() => UserPhotoDto)
  public readonly photos: UserPhotoDto[]
}

class UserPhotoDto {
  @ApiProperty({
    description: 'The name of the photo',
    example: 'Photo 1',
  })
  @IsString()
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  public readonly name: string

  @ValidateIf((o) => o.description !== undefined)
  @IsString({ message: 'Description must be a string' })
  @Length(10, 200, {
    message: 'Description must be between 10 and 200 characters',
  })
  public readonly description?: string

  @ApiProperty({
    description: 'The size of the photo',
    example: 1024,
  })
  @IsInt()
  @Min(1, { message: 'Size must be at least 1 byte' })
  @Max(5_000_000, { message: 'Size must not exceed 5MB' })
  public readonly size: number

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true }, { message: 'Invalid URL format' })
  public readonly url: string
}
