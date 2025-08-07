import { CacheModuleAsyncOptions } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { redisStore } from 'cache-manager-redis-store'

export const redisOptions: CacheModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const store = await redisStore({
      socket: {
        host: process.env.REDIS_HOST!,
        port: parseInt(process.env.REDIS_PORT!),
      },
    })

    return {
      store: () => store,
    }
  },
}
