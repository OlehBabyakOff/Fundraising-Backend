import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    // origin: 'https://your-frontend-url.com',
    methods: ['GET', 'POST'],
  },
})
export class WebSocketGatewayProvider
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebSocketGatewayProvider.name);
  private readonly jwtService: JwtService;
  private readonly configService: ConfigService;

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.warn(
          `Connection refused: Missing token for client ${client.id}`,
        );

        return client.disconnect(true);
      }

      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (!decoded) {
        this.logger.warn(
          `Invalid token payload for client ${client.id}: ${JSON.stringify(decoded)}`,
        );

        return client.disconnect(true);
      }

      client.data.user = decoded;

      this.logger.log(
        `Client connected: ${client.id}, User: ${JSON.stringify(decoded)}`,
      );
    } catch (err) {
      this.logger.error(
        `Connection error for client ${client.id}: ${err.message}`,
      );

      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('notification')
  handleNotification(client: Socket, payload: any) {
    this.logger.log(
      `Received notification from ${client.id}: ${JSON.stringify(payload)}`,
    );
  }

  sendNotification(clientId: string, message: string) {
    const client = this.server.sockets.sockets.get(clientId);

    if (client) {
      client.emit('notification', { message });
    } else {
      this.logger.warn(`Client with ID ${clientId} not found.`);
    }
  }

  broadcastNotification(message: string) {
    this.server.emit('notification', { message });
  }
}
