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
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Socket } from 'socket.io';
import { FriendService } from './friend.service';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';
import { AllExceptionsSocketFilter } from 'src/common/exceptions/websocket-exception.filter';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@WebSocketGateway({ namespace: 'friend' })
@UseFilters(AllExceptionsSocketFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class FriendGateway {
  constructor(
    private friendService: FriendService,
    private authService: AuthService,
    private userSerivce: UserService,
  ) {}

  private readonly logger = new Logger(FriendGateway.name);

  @WebSocketServer()
  server: Server;
  /*
  @SubscribeMessage('get')
  async getFriendList(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    const friendIds = await this.friendService.getFriendListByFromId(userId);
    const friendList = [];
    for (const id of friendIds) {
      friendList.push(
        await this.userSerivce.getUserElementsById(id.to, [
          'id',
          'nickname',
          'avatar',
          'userState',
        ]),
      );
    }
    return friendList;
  }

  @SubscribeMessage('createFriend')
  async createFriendList(
    @ConnectedSocket() client: Socket,
    @MessageBody('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    this.logger.log(`User ${userId} is trying to add ${followingUserId}`);
    if (userId === followingUserId)
      throw new WsException(`Can't be friend with yourself`);
    return await this.friendService
      .creatFriend({
        from: userId,
        to: followingUserId,
      })
      .catch((err) => {
        this.logger.log(err);
        throw new WsException(err);
      });
  }

  @SubscribeMessage('deleteFriend')
  async deleteFriend(
    @ConnectedSocket() client: Socket,
    @MessageBody('followingUserId', ParseIntPipe, PositiveIntPipe)
    followingUserId: number,
  ) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    if (userId === followingUserId)
      throw new WsException(`Can't remove yourself from your friend list`);
    await this.friendService
      .deleteFriend({
        from: userId,
        to: followingUserId,
      })
      .catch((err) => {
        this.logger.error(err);
        throw new WsException(err);
      });
  }
  */
}
