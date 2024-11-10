import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/user/user.module';

import { APIConfig, CacheConfig, DatabaseConfig, EthersConfig } from './config';
import { RedisModule } from './providers/cache/redis.module';
import { EthersModule } from './providers/ethers/ethers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [APIConfig, DatabaseConfig, CacheConfig, EthersConfig],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO.URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    EthersModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
