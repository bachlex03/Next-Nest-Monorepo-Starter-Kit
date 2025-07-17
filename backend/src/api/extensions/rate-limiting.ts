import { seconds, ThrottlerModuleOptions, ThrottlerOptionsFactory } from '@nestjs/throttler'

export class RateLimitingFactory implements ThrottlerOptionsFactory {
  constructor() {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    return [
      { name: 'short', ttl: seconds(10), limit: 10 },
      { name: 'medium', ttl: seconds(10), limit: 30 },
      { name: 'long', ttl: seconds(60), limit: 50 },
    ]
  }
}
