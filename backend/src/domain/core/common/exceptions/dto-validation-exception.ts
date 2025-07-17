import { HttpException, HttpStatus } from '@nestjs/common'

export class DtoValidationException extends HttpException {
  constructor(message: string, errors: any) {
    super(
      {
        message: message,
        errors: errors,
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}
