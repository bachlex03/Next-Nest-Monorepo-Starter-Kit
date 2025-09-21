/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ArgumentMetadata, BadRequestException, PipeTransform, ValidationError } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { DtoValidationException } from 'src/domain/core/common/exceptions/dto-validation-exception'

export class DtoValidationPine implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value
    }

    const object = plainToInstance(metatype, value)
    const errors = await validate(object)

    if (errors.length > 0) {
      throw this.createValidationException(errors)
    }

    return object // Return transformed object instead of original value
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }

  private createValidationException(validationErrors: ValidationError[]): BadRequestException {
    const getPrettyClassValidatorErrors = (
      validationErrors: ValidationError[],
      parentProperty = '',
    ): Array<{ property: string; errors: string[] }> => {
      const errors: Array<{ property: string; errors: string[] }> = []

      const getValidationErrorsRecursively = (validationErrors: ValidationError[], parentProperty = '') => {
        for (const error of validationErrors) {
          const propertyPath = parentProperty ? `${parentProperty}.${error.property}` : error.property

          if (error.constraints) {
            errors.push({
              property: propertyPath,
              errors: Object.values(error.constraints),
            })
          }

          if (error.children?.length) {
            getValidationErrorsRecursively(error.children, propertyPath)
          }
        }
      }

      getValidationErrorsRecursively(validationErrors, parentProperty)

      return errors
    }

    const errors = getPrettyClassValidatorErrors(validationErrors)

    return new DtoValidationException('validation error', errors)
  }
}
