import {
  ConsoleLogger,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/user.dto';
import { UserEntity } from 'src/user/user.entity';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';

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
      select: ['id', 'ftId'],
    });
    if (!user) user = await this.userRepository.createUser(createUserDto);
    const accessToken =
      user.accessToken || (await this.generateAccessTokenFree(user));
    const refreshToken =
      user.refreshToken || (await this.generateRefreshToken(user));
    const reUser = await this.userService.getUserById(user.id);
    return { user: reUser, accessToken, refreshToken };
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
      refreshToken: refreshToken,
    });
    if (!result) throw new UnauthorizedException();
    return await this.generateAccessTokenFree(result);
  }
}
