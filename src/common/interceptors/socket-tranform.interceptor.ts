import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class SocketTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const clientCallback = context.switchToWs().getData().args;
    const event = context.switchToWs().getData().event;

    return next.handle().pipe(
      map((data) => ({
        event_name: event,
        data: data,
      })),
      tap((response) => {
        if (typeof clientCallback === 'function') {
          clientCallback(response);
        }
      }),
    );
  }
}
