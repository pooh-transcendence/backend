import { Logger, ParseIntPipe } from '@nestjs/common';
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
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({ namespace: 'friend' })
export class FriendGateway {
  constructor(
    private friendService: FriendService,
    private authService: AuthService,
    private userSerivce: UserService,
  ) {}

  private readonly logger = new Logger(FriendGateway.name);
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('getFriends')
  async getFriendList(@ConnectedSocket() client: Socket) {
    const user = await this.authService.getUserFromSocket(client);
    if (!user) throw new WsException('Unauthorized');
    const userId = user.id;
    const friendIds = await this.friendService.getFriendListByFromId(userId);
    const friendList = [];
    for (const id of friendIds) {
      friendList.push(
        await this.userSerivce.getUserElementsById(id.to, [
          'id, username, avatar',
        ]),
      );
    }
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
      throw new WsException(`Can't be friend with yourself`);
    return await this.friendService.creatFriend({
      from: userId,
      to: followingUserId,
    });
  }

  @SubscribeMessage('delete')
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
    await this.friendService.deleteFriend({
      from: userId,
      to: followingUserId,
    });
  }
}
