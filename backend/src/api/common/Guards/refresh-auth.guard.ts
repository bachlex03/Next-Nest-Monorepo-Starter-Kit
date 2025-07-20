import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { STRATEGY_NAME } from 'src/api/common/constants/strategy-name.constant'

@Injectable()
export class RefreshAuthGuard extends AuthGuard(STRATEGY_NAME.REFRESH_JWT) {}
