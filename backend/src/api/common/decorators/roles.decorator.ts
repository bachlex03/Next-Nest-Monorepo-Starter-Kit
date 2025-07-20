import { Role } from 'src/domain/core/enums/role.enum'
import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
// at least one role is required
export const Roles = (...roles: [Role, ...Role[]]) => SetMetadata(ROLES_KEY, roles)
