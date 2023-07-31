import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FortyTwoApiService {
  private readonly baseUrl = 'https://api.intra.42.fr';

  async getDataFrom42API(
    token: string,
    endpoint: string,
    params?: Record<string, any>,
  ) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        `Failed to fetch data from 42 API: ${error.message}`,
        400,
      );
    }
  }
}
