import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class TimeExecutingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeExecutingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>()

    // Pre-processing
    const method = req.method
    const url = req.url
    const now = Date.now()

    // Post-processing
    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - now
        this.logger.log(`${method} ${url} - ${elapsed}ms`)
      }),
    )
  }
}
