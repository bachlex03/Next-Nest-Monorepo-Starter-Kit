import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start
      const { statusCode } = res
      const userAgent = req.get('user-agent') || ''
      const ip = req.ip

      // Use appropriate log level based on status code
      if (statusCode >= 400) {
        this.logger.error(`${method} ${originalUrl} ${statusCode} - ${userAgent} ${ip} - duration:${duration / 1000}s`)
      } else {
        this.logger.log(`${method} ${originalUrl} ${statusCode} - ${userAgent} ${ip} - duration:${duration / 1000}s`)
      }
    })

    next()
  }
}
