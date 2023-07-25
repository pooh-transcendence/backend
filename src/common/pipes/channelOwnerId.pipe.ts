import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CreateChannelDto } from 'src/channel/channel.dto';

@Injectable()
export class ChannelOwnerIdPipe implements PipeTransform {
  transform(value: CreateChannelDto) {
    if (!value.hasOwnProperty('ownerId')) {
      throw new BadRequestException(`Validation failed: ownerId is required`);
    }

    // if (isNaN(parseInt(value.ownerId))) {
    //   throw new BadRequestException(
    //     `Validation failed: ownerId must be an integer`,
    //   );
    // }

    // value.ownerId = parseInt(value.ownerId);

    // check positive
    if (value.ownerId <= 0) {
      throw new BadRequestException(
        `Validation failed: ownerId must be positive`,
      );
    }

    return value;
  }
}
