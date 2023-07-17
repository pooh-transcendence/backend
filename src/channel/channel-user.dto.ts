export class CreateChanneUserDto {
  userId: number;
  channelId: number;
  isAdmin: boolean;
  isBanned: boolean;
  password: string;
}
