import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { ChannelEntity } from './channel.entity';
import { UserEntity } from 'src/user/user.entity';
import { IsBoolean, IsNotEmpty } from 'class-validator';

@Entity()
export class ChannelUserEntity extends CommonEntity {
  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;

  @ManyToOne(() => ChannelEntity, (channel) => channel.channelUser, {
    eager: true,
  })
  channel: ChannelEntity;

  @Column({ default: false })
  @IsBoolean()
  @IsNotEmpty()
  isAdmin: boolean;

  @Column({ default: false })
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;
}
