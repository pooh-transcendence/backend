import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FortyTwoApiService {
  private readonly baseUrl = 'https://api.intra.42.fr';
  //private readonly accessToken =
  //  '344da0ec154bb944b972563c742d1f4cc0876ed0e15f1d7ed11d5a5925d121be'; // 여기에 42 API에서 발급받은 Bearer 토큰을 넣어주세요.

  // 42 API를 호출하는 GET 메서드
  async get(token: string, endpoint: string, params?: Record<string, any>) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      // 오류 처리
      throw new Error(`Failed to fetch data from 42 API: ${error.message}`);
    }
  }
}
