import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Unique } from 'typeorm';
import { IsBoolean, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

@Entity()
@Unique(['userId', 'channelId'])
export class ChannelUserEntity extends CommonEntity {
  /*@ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;*/
  @Column()
  @IsNumber()
  @IsPositive()
  userId: number;

  /*
  @ManyToOne(() => ChannelEntity, (channel) => channel.channelUser, {
    eager: true,
  })
  channel: ChannelEntity;
  */
  @Column()
  @IsNotEmpty()
  @IsNumber()
  channelId: number;

  @Column({ default: false })
  @IsBoolean()
  @IsNotEmpty()
  isAdmin: boolean;

  @Column({ default: false })
  @IsBoolean()
  @IsNotEmpty()
  isBanned: boolean;
}
