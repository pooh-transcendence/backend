import { HttpException, Injectable, PipeTransform } from '@nestjs/common';
import { CreateChannelDto } from 'src/channel/channel.dto';
import { ChannelType } from 'src/channel/channel.entity';

@Injectable()
export class ChannelTypePipe implements PipeTransform {
  transform(value: CreateChannelDto) {
    if (value.channelType === ChannelType.PROTECTED && !value.password) {
      throw new HttpException(
        `Protected Channel ${value.channelName} doesn't have password`,
        400,
      );
    } else if (
      (value.channelType === ChannelType.PUBLIC ||
        value.channelType === ChannelType.PRIVATE) &&
      value.password
    ) {
      throw new HttpException(
        `Public or Private Channel ${value.channelName} has password`,
        400,
      );
    }
    return value;
  }
}
