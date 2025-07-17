import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidatorOptions,
} from 'class-validator'

@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
class IsValidPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, args: ValidationArguments) {
    return (
      typeof password === 'string' &&
      password.length > 5 &&
      password.length <= 20 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0–9]/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    )
  }

  defaultMessage(args: ValidationArguments) {
    return 'Password must be between 6 and 20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character'
  }
}

export function IsValidPassword(validationOptions?: ValidatorOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPasswordConstraint,
    })
  }
}
