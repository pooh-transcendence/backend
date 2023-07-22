import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtModuleConfig } from 'src/configs/jwt.config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register(JwtModuleConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
