import { CommonEntity } from 'src/common/common.entity';
import internal from 'stream';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
export class FriendEntity extends CommonEntity {
  @Column()
  from: number;

  @Column()
  to: number;
}
