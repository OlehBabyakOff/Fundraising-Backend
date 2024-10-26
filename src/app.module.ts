import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
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
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO.URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    AuthModule,
    BlockchainModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
