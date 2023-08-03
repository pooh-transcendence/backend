/*
import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Request, Response } from 'express';

@Catch(WsException)
export class WebSocketFilter implements BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost): void {
    throw new Error('Method not implemented.');
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  handleError<TClient extends { emit: Function }>(
    client: TClient,
    exception: any,
  ): void {
    throw new Error('Method not implemented.');
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  handleUnknownError<TClient extends { emit: Function }>(
    exception: any,
    client: TClient,
  ): void {
    throw new Error('Method not implemented.');
  }
  isExceptionObject(err: any): err is Error {
    throw new Error('Method not implemented.');
  }

  catch(exception: WsException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const error = exception.getError() as
      | string
      | { error: string; statusCode: number; message: string | string[] };

    if (typeof error === 'string') {
      response.status(400).json({
        success: false,
        timestamp: new Date().toISOString(),
        path: request.url,
        error,
      });
    } else {
      response.status(400).json({
        success: false,
        timestamp: new Date().toISOString(),
        ...error,
      });
    }
  }
}
*/

import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { PacketType } from 'socket.io-parser';

@Catch()
export class AllExceptionsSocketFilter extends BaseWsExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    client.packet({
      type: PacketType.ACK,
      data: [{ sucess: false, error: exception?.message }],
      id: client.nsp._ids++,
    });
  }
}
