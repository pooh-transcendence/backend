import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class MessageEntity extends CommonEntity {
  @Column()
  fromId: number;

  @Column()
  fromNickname: string;

  @Column({ nullable: true })
  toUserId: number;

  @Column({ nullable: true })
  toChannelId: number;

  @Column()
  message: string;
}
