import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/user.dto';
import { UserEntity, UserState } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import * as speakeasy from 'speakeasy';
import { Socket } from 'socket.io';
import { JwtModuleConfig } from 'src/configs/jwt.config';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(createUserDto: CreateUserDto) {
    const { ftId } = createUserDto;
    let user = await this.userRepository.findOne({
      where: { ftId },
    });
    if (!user) user = await this.userRepository.createUser(createUserDto);
    const accessToken =
      user.accessToken || (await this.generateAccessTokenFree(user));
    const refreshToken =
      user.refreshToken || (await this.generateRefreshToken(user));
    user.accessToken = undefined;
    user.refreshToken = undefined;
    return { user, accessToken, refreshToken };
  }

  async signInByUserId(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user)
      throw new HttpException(
        '아이디부터 만들어 주세요',
        HttpStatus.BAD_REQUEST,
      );
    const accessToken =
      user.accessToken || (await this.generateAccessTokenFree(user));
    const refreshToken =
      user.refreshToken || (await this.generateRefreshToken(user));
    user.accessToken = undefined;
    user.refreshToken = undefined;
    user.socketId = undefined;
    return { user, accessToken, refreshToken };
  }

  async generateRefreshToken(user: UserEntity): Promise<string> {
    const payload = { id: user.id };
    const refreshToken = await this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      secret: process.env.JWT_REFRESH_SECRET,
    });
    await this.userRepository.updateUserRefreshToken(user.id, refreshToken);
    return refreshToken;
  }

  async generateAccessTokenFree(user: UserEntity): Promise<string> {
    const payload = { id: user.id, nickname: user.nickname, ftId: user.ftId };
    const accessToken = await this.jwtService.sign(payload);
    await this.userRepository.updateUserAcessToken(user.id, accessToken);
    return accessToken;
  }

  async generateAccessToken(
    userId: number,
    refreshToken: string,
  ): Promise<string> {
    const result = await this.userRepository.findOneBy({
      id: userId,
      refreshToken,
    });
    if (!result) throw new UnauthorizedException();
    return await this.generateAccessTokenFree(result);
  }

  async signOut(userId: number) {
    await this.userRepository.updateUserAcessToken(userId, null);
    await this.userRepository.updateUserRefreshToken(userId, null);
    await this.userRepository.updateUserState(userId, UserState.OFFLINE);
  }

  generateSecret() {
    return speakeasy.generateSecret();
  }

  generateQRCodeURL(secret: string, user: string, issuer: string) {
    return speakeasy.otpauthURL({ secret, label: user, issuer });
  }

  verifyToken(secret: string, token: string) {
    return speakeasy.totp.verify({ secret, encoding: 'base32', token });
  }

  async getUserFromSocket(socket: Socket): Promise<any> {
    try {
      const token = socket.handshake.headers.authorization;
      //const token = socket.handshake.auth.authorization;
      if (!token) return null;
      const payload = this.jwtService.verify(token, {
        secret: JwtModuleConfig.secret,
        ignoreExpiration: true,
      });
      if (!payload) return null;
      const user = await this.userService
        .getUserById(payload.id)
        .catch(() => null);
      if (!user) return null;
      return user;
    } catch (err) {
      return null;
    }
  }

  getUserIdFromSocket(socket: Socket): number {
    const token = socket.handshake.auth.authorization;
    if (!token) return null;
    const payload = this.jwtService.verify(token, {
      secret: JwtModuleConfig.secret,
      ignoreExpiration: true,
    });
    if (!payload) return null;
    return payload.id;
  }
}
