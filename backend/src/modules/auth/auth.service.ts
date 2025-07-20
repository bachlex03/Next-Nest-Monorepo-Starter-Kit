import { Injectable, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class AuthService {
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
