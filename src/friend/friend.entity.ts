import { IsNotEmpty, IsNumber } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['from', 'to'])
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
