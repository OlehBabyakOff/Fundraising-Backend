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
import { ethers } from 'ethers';

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

  private addressToSocketMap = new Map<string, string>();

  constructor(jwtService: JwtService, configService: ConfigService) {
    this.jwtService = jwtService;
    this.configService = configService;
  }

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

      this.addressToSocketMap.set(
        decoded.walletAddress.toLowerCase(),
        client.id,
      );

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
    const userAddress = [...this.addressToSocketMap.entries()].find(
      ([_, socketId]) => socketId === client.id,
    )?.[0];

    if (userAddress) {
      this.addressToSocketMap.delete(userAddress);
      this.logger.log(
        `Client disconnected: ${client.id}, Wallet: ${userAddress}`,
      );
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  }

  async notifyDonationEvent(donor: string, amount: string) {
    const donorSocketId = this.addressToSocketMap.get(donor.toLowerCase());

    if (donorSocketId) {
      this.server.to(donorSocketId).emit('donationReceived', {
        role: 'donor',
        amount,
      });
    }
  }

  async notifyRefundEvent(donor: string, amount: string) {
    const donorSocketId = this.addressToSocketMap.get(donor.toLowerCase());

    if (donorSocketId) {
      this.server.to(donorSocketId).emit('refundIssued', {
        role: 'donor',
        amount,
      });
    }
  }

  async notifyReleaseEvent(creator: string, amount: string) {
    const creatorSocketId = this.addressToSocketMap.get(creator.toLowerCase());

    if (creatorSocketId) {
      this.server.to(creatorSocketId).emit('fundsReleased', {
        role: 'creator',
        amount,
      });
    }
  }
}
