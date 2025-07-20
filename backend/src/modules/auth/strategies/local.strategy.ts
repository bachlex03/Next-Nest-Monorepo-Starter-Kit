import { Strategy } from 'passport-local'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable } from '@nestjs/common'

import { AuthService } from 'src/modules/auth/auth.service'

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    })
  }

  validate(email: string, password: string): Promise<unknown> {
    return this.authService.validateUser(email, password)
  }
}

/**
 * default name: 'local'
 * name: 'local' used for @UseGuards(LocalAuthGuard)
 */
