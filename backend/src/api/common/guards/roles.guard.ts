import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'

import { ROLES_KEY } from 'src/api/common/decorators/roles.decorator'
import { Role } from 'src/domain/core/enums/role.enum'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) return true

    const user = context.switchToHttp().getRequest().user

    const hasRequiredRoles = requiredRoles.some((role) => user.roles?.includes(role))

    return hasRequiredRoles
  }
}
