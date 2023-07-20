import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';

@Entity()
export class BlockEntity extends CommonEntity {
  @Column()
  from: number;

  @Column()
  to: number;
}
