import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './configs/typeorm.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    /*,AuthModule, UserModule, ChatModule*/ UserModule],
  controllers: [],
  providers: [],
})

export class AppModule {}
