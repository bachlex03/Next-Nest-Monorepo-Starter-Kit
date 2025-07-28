import { Module } from '@nestjs/common'
import { LogoutHandler } from './commands/logout/logout.handler'
import { RegisterHandler } from './commands/register/register.handler'
import { LoginHandler } from './commands/login/login.handler'
import { AuthModule } from 'src/modules/auth/auth.module'
import { TokenModule } from 'src/modules/token/token.module'
import { UsersModule } from 'src/modules/users/users.module'
import { UserCreatedEventHandler } from './events/user-created.handler'

@Module({
  imports: [UsersModule, TokenModule, AuthModule],
  providers: [LoginHandler, RegisterHandler, LogoutHandler, UserCreatedEventHandler],
})
export class AuthCqrsModule {}
