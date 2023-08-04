import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export const cacheModuleConfig: CacheModuleOptions = {
  isGlobal: true,
  ttl: 0,
  max: 100,
  isStore: redisStore,
  password: process.env.REDIS_HOST_PASSWORD,
  socket: {
    port: 6379,
    host: process.env.REDIS_HOST || 'redis' || 'localhost',
  },
};
