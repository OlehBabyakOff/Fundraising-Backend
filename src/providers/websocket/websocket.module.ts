import { Module } from '@nestjs/common';
import { WebSocketGatewayProvider } from './websocket.gateway.provider';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [WebSocketGatewayProvider],
  exports: [WebSocketGatewayProvider],
})
export class WebSocketModule {}
