import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { CreateUserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { ref } from 'joi';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('signIn')
  async signIn(@Body() createUserDto: CreateUserDto, @Res() res) {
    const { user, accessToken, refreshToken } = await this.authService.signIn(
      createUserDto,
    );
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    res.send(user);
  }
}
