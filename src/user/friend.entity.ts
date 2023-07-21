import { IsNotEmpty, IsNumber } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class FriendEntity extends CommonEntity {
  @IsNumber()
  @IsNotEmpty()
  @Column()
  from: number;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  to: number;
}
