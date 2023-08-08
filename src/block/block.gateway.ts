import {
  Logger,
  ParseIntPipe,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
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
import { BlockService } from './block.service';
import { AuthService } from 'src/auth/auth.service';
import { Server } from 'ws';
import { Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@WebSocketGateway({ namespace: 'block' })
@UseFilters(AllExceptionsSocketFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class BlockGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private blockService: BlockService,
    private authService: AuthService,
    private userService: UserService,
  ) {}
  private logger = new Logger(BlockGateway.name);
  @WebSocketServer()
  private server: Server;

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleConnection(client: Socket, ...args: any[]) {}

  handleDisconnect(client: Socket) {}
  /*
  @SubscribeMessage('get')
  async getBlockList(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    const blockIds = await this.blockService.getBlockListByFromId(userId);
    const blockList = [];
    for (const id of blockIds) {
      blockList.push(
        await this.userService.getUserElementsById(id.to, [
          'id',
          'username',
          'avatar',
        ]),
      );
    }
    return blockList;
  }

  @SubscribeMessage('createBlock')
  async createFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('blockUserId', ParseIntPipe, PositiveIntPipe)
    blockUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === blockUserId)
      throw new WsException(`Can't be block with yourself`);
    return await this.blockService
      .createBlock({
        from: userId,
        to: blockUserId,
      })
      .catch((err) => {
        this.logger.error(err);
        throw new WsException(err);
      });
  }

  @SubscribeMessage('deleteBlock')
  async deleteFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('blockedUserId', ParseIntPipe, PositiveIntPipe)
    blockedUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === blockedUserId)
      throw new WsException(`Can't be block with yourself`);
    return await this.blockService
      .deleteBlock({
        from: userId,
        to: blockedUserId,
      })
      .catch((err) => {
        this.logger.error(err);
        throw new WsException(err);
      });
  }
  */
}
