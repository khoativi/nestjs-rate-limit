import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import ValKey from 'iovalkey';

import { RateLimitModule, RateLimitOptions, ValkeyAdapter } from '../src';
import { AppController } from './app.controller';

const rateLimitConfig = (configService: ConfigService): RateLimitOptions => {
  const redisClient = new ValKey(configService.get<string>('REDIS_URL')!);
  return {
    duration: 30,
    limit: 5,
    storeClient: new ValkeyAdapter(redisClient),
    errorMessage: 'Too Many Requests',
    countAllRequests: true
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimitModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: rateLimitConfig,
      inject: [ConfigService]
    })
  ],
  controllers: [AppController]
})
export class AppModule {}
