import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { STRATEGY_NAME } from '../constants/strategy-name.constant'

@Injectable()
export class GoogleAuthGuard extends AuthGuard(STRATEGY_NAME.GOOGLE_OAUTH) {}
