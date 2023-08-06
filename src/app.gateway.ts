/*import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import {
  Inject,
  Logger,
  NotFoundException,
  ParseIntPipe,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Server } from 'ws';
@WebSocketGateway()
export class AppGateWay
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger(AppGateWay.name);
  constructor() {
    this.logger.log('Init');
  }

  @WebSocketServer()
  private server: Server;

  afterInit(server: any) {
    this.logger.log('init!!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log('connected');
  }

  handleDisconnect(client: Socket) {
    this.logger.log('disconnected');
  }
}*/
