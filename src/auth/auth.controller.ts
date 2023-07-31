import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { GetUser } from './get-user.decostor';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from 'src/user/user.entity';
import { FortyTwoApiService } from './fortytwo.service';
import { TransformInterceptor } from 'src/common/tranfrom.interceptor';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';

@Controller('auth')
@UseInterceptors(TransformInterceptor)
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private fortyTwoApiService: FortyTwoApiService,
  ) {}
  /*
  @Post('signin')
  async signIn(@Body() createUserDto: CreateUserDto, @Res() res) {
    const { user, accessToken, refreshToken } = await this.authService.signIn(
      createUserDto,
      false,
    );
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    res.send(user);
  }
  */
  @Post('signout')
  @UseGuards(AuthGuard())
  async signOut(@GetUser('id') user: UserEntity, @Req() req) {
    await this.authService.signOut(user.id);
    req.res.clearCookie('accessToken');
    req.res.clearCookie('refreshToken');
    req.res.send();
  }

  @Get('accessToken')
  async getAccessToken(@Body('id', ParseIntPipe) userId: number, @Req() req) {
    const refreshToken = req.headers.cookie
      .split('; ')
      .find((x) => x.startsWith('refreshToken'))
      .split('=')[1];
    return await this.authService.generateAccessToken(userId, refreshToken);
  }

  @Post('signIn')
  async signUp(@Body('ftToken') token: string) {
    const data = await this.fortyTwoApiService.getDataFrom42API(
      token,
      '/v2/me',
    );
    const createUserDto: CreateUserDto = {
      ftId: data.id,
      nickname: data.login,
      email: data.email,
      token: token,
    };
    const { user } = await this.authService.signIn(createUserDto);
    const secret = this.authService.generateSecret();
    await this.userService.updateUserElements(user.id, {
      secret: secret.base32,
    });
    const userEmail = user.email;
    const issuer = user.nickname;
    const qrCodeURL = this.authService.generateQRCodeURL(
      secret.ascii,
      userEmail,
      issuer,
    );
    return { qrCodeURL, userId: user.id };
  }

  async setupTwoFactorAuth(user: UserEntity) {
    const secret = this.authService.generateSecret();
    await this.userService.updateUserElements(user.id, {
      secret: secret.base32,
    });
    const userEmail = user.email;
    const issuer = user.nickname;
    const qrCodeURL = this.authService.generateQRCodeURL(
      secret.ascii,
      userEmail,
      issuer,
    );
    return { qrCodeURL, userId: user.id };
  }

  @Post('signInWithVerificationCode')
  async verifyTwoFactorAuth(
    @Body('verificationCode') verificationCode: any,
    @Body('userId', ParseIntPipe, PositiveIntPipe) userId: number,
    @Res() res,
  ) {
    const userElements = await this.userService.getUserById(userId);
    const isVerified = this.authService.verifyToken(
      userElements.secret,
      verificationCode,
    );
    if (isVerified) {
      const { user, accessToken, refreshToken } =
        await this.authService.signInByUserId(userId);
      await this.userService.updateUserElements(userId, { secret: null });
      res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
      });
      user.secret = undefined;
      user.token = undefined;
      res.send(user);
    } else {
      throw new UnauthorizedException();
    }
  }
}
