import { Logger, NestMiddleware } from '@nestjs/common';
import { Server } from 'socket.io';

export class SocketLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('SOCKET');
  use(req: any, res: any, next: () => void) {
    const io: Server = req.app.get('io');
    io.use((socket, nextSocket) => {
      this.logger.log(`Socket connected: ${socket.id}`);
      socket.on('disconnect', () => {
        this.logger.log(`Socket disconnected: ${socket.id}`);
      });
      nextSocket();
    });
    next();
  }
}
