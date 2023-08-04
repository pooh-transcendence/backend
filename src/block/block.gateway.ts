import { Logger, ParseIntPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
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
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@WebSocketGateway({ namespace: 'block' })
export class BlockGateway {
  constructor(
    private blockService: BlockService,
    private authService: AuthService,
    private userService: UserService,
  ) {}
  private logger = new Logger(BlockGateway.name);
  @WebSocketServer()
  private server: Server;

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
          'id, username, avatar',
        ]),
      );
    }
    return blockList;
  }
  @SubscribeMessage('create')
  async createFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === followingUserId)
      throw new WsException(`Can't be block with yourself`);
    return await this.blockService.createBlock({
      from: userId,
      to: followingUserId,
    });
  }

  @SubscribeMessage('delete')
  async deleteFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === followingUserId)
      throw new WsException(`Can't be block with yourself`);
    return await this.blockService.deleteBlock({
      from: userId,
      to: followingUserId,
    });
  }
}
