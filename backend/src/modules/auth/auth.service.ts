import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthJwtPayload } from 'src/domain/core/types/auth-jwtpayload'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}
  login() {
    const payload: AuthJwtPayload = {
      id: 'user-id',
    }

    return this.jwtService.sign(payload)
  }

  async validateUser(email: string, password: string) {
    try {
      return {
        id: 'user-id',
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials')
    }
  }
}
