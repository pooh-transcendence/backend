import { DataSource, Repository } from 'typeorm';
import { ChannelUserEntity } from './channel-user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { MessageEntity } from './message.entity';

@Injectable()
export class MesssageRepository extends Repository<MessageEntity> {
  constructor(@InjectRepository(MessageEntity) private dataSource: DataSource) {
    super(MessageEntity, dataSource.manager);
  }
}
