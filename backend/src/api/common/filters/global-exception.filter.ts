import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const isDevelopment = true

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception instanceof HttpException ? exception.message : 'Internal server error'
    const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Log the exception with context
    if (exception instanceof Error) {
      this.logger.error(`Error on ${request.method} ${request.url}`, exception.stack)
    } else {
      this.logger.error(`Unknown exception on ${request.method} ${request.url}`)
    }

    const responseBody = {
      title: exception instanceof HttpException ? exception.constructor.name : 'InternalServerError',
      statusCode: status,
      message: message,
      errors: null,
      path: request.url,
      method: request.method,
      traceId: traceId,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && { stack: exception instanceof Error ? exception.stack : undefined }),
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, status)
  }
}
