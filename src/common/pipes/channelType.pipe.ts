import {
  HttpException,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { CreateChannelDto } from 'src/channel/channel.dto';
import { ChannelType } from 'src/channel/channel.entity';

@Injectable()
export class ChannelTypePipe implements PipeTransform {
  transform(value: CreateChannelDto) {
    if (value.channelType === ChannelType.PROTECTED && !value.password) {
      throw new HttpException(
        `Protected Channel ${value.channelName} must have password`,
        HttpStatus.BAD_REQUEST,
      );
    } else if (
      (value.channelType === ChannelType.PUBLIC ||
        value.channelType === ChannelType.PRIVATE) &&
      value.password
    ) {
      throw new HttpException(
        `Public or Private Channel ${value.channelName} must not have password`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }
}
