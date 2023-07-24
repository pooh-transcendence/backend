import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['from', 'to'])
export class BlockEntity extends CommonEntity {
  @Column()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  from: number;

  @Column()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  to: number;
}
