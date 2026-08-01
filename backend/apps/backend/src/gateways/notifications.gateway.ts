import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;
    if (userId) client.join(`user:${userId}`);
  }

  handleDisconnect(_client: Socket) {}

  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
