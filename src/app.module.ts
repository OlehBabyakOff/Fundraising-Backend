import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './providers/cache/redis.module';

import { AuthModule } from './app/auth/auth.module';
import { BlockchainModule } from './app/blockchain/blockchain.module';

import { APIConfig, CacheConfig, DatabaseConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [APIConfig, DatabaseConfig, CacheConfig],
      isGlobal: true,
    }),
    RedisModule,
    AuthModule,
    BlockchainModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
