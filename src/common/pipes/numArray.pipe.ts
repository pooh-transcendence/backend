import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class NumArrayPipe implements PipeTransform {
  transform(value: number[], metadata: ArgumentMetadata) {
    if (!Array.isArray(value)) {
      throw new BadRequestException(
        'Validation failed (numeric string[] is expected)',
      );
    }

    const isNumericArray = value.every((val) => typeof val === 'number');

    if (!isNumericArray) {
      throw new BadRequestException(
        'Validation failed (All elements should be of type number)',
      );
    }

    return value;
  }
}
