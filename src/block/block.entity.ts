import { IsNotEmpty, IsNumber } from 'class-validator';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class BlockEntity extends CommonEntity {
  @Column()
  @IsNumber()
  @IsNotEmpty()
  from: number;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  to: number;
}
