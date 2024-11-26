import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PinataProvider } from './pinata.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PinataProvider],
  exports: [PinataProvider],
})
export class PinataModule {}
