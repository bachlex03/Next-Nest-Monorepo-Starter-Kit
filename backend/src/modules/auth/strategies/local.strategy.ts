import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'

import { AuthService } from 'src/modules/auth/auth.service'
import { User } from '@prisma/client'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    })
  }

  validate(email: string, password: string): Promise<Omit<User, 'password'>> {
    if (password === '') {
      throw new UnauthorizedException('Please provide the password')
    }

    return this.authService.validateUser(email, password)
  }
}

/**
 * default name: 'local'
 * name: 'local' used for @UseGuards(LocalAuthGuard)
 */
