import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['from', 'to'])
export class FriendEntity extends CommonEntity {
  @Column()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  from: number;

  @Column()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  to: number;
}
