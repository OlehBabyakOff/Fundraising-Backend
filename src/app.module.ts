import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from './providers/cache/redis.module';
import { EthersModule } from './providers/ethers/ethers.module';
import { PinataModule } from './providers/pinata/pinata.module';
import { MulterModule } from '@nestjs/platform-express';

import { AuthModule } from './app/auth/auth.module';
import { UserModule } from './app/user/user.module';

import { memoryStorage } from 'multer';

import { APIConfig, CacheConfig, DatabaseConfig, EthersConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [APIConfig, DatabaseConfig, CacheConfig, EthersConfig],
      isGlobal: true,
    }),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO.URI'),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    PinataModule,
    EthersModule,
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
