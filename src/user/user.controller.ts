import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decostor';
import { TransformInterceptor } from 'src/common/interceptors/tranform.interceptor';
import { PositiveIntPipe } from 'src/common/pipes/positiveInt.pipe';
import { UserProfileDto } from './user.dto';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@Controller('user')
@UseInterceptors(TransformInterceptor)
@UseGuards(AuthGuard())
export class UserController {
  constructor(private userService: UserService) {}

  private logger = new Logger(UserController.name);

  // 유저 본인의 정보를 가져온다.
  @Get()
  async getUser(@GetUser() user: UserEntity): Promise<UserEntity> {
    return await this.userService.getUserById(user.id);
  }

  // 유저의 친구 목록을 가져온다.
  @Get('/friend')
  async getFriendListByUserId(
    @GetUser() user: UserEntity,
  ): Promise<UserEntity[]> {
    return await this.userService.getFriendListByUserId(user.id);
  }

  // 유저의 채널 목록을 가져온다.
  @Get('/channel')
  async getChannelListByUserId(@GetUser() user: UserEntity): Promise<any[]> {
    return await this.userService.getChannelListByUserId(user.id);
  }

  // 유저의 닉네임으로 유저 정보를 가져온다.
  @Get('/search/:nickname')
  async getUserProfileByNickname(
    @GetUser() requestUser: UserEntity,
    @Param('nickname') nickname: string,
  ): Promise<UserProfileDto> {
    const user = await this.userService.getUserProfileByNickname(
      requestUser.id,
      nickname,
    );
    return user;
  }

  @Get('/allUser')
  async getAllUser() {
    this.logger.log('getAllUser');
    return await this.userService.getAllUser();
  }

  // 유저의 아이디로 유저 정보를 가져온다.
  @Get('/:userId')
  async getUserProfileById(
    @GetUser() requestUser: UserEntity,
    @Param('userId', ParseIntPipe, PositiveIntPipe) userId: number,
  ): Promise<UserProfileDto> {
    return await this.userService.getUserProfileById(requestUser.id, userId);
  }

  // 유저의 아바타 변경
  @Patch('/avatar')
  async updateUserAvatar(
    @GetUser() user: UserEntity,
    @Body('avatar') avatar: string,
  ) {
    return await this.userService.updateUserElements(user.id, { avatar });
  }

  // 유저의 닉네임 변경
  @Patch('/nickname')
  async updateUserNickname(
    @GetUser() user: UserEntity,
    @Body('nickname') nickname: string,
  ) {
    if (nickname.length < 2 || nickname.length > 10)
      throw new BadRequestException('Nickname is empty');
    return await this.userService.updateUserElements(user.id, { nickname });
  }

  @Post('avatarUpload')
  //@UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    /*@UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'jpeg',
        })
        .addMaxSizeValidator({
          maxSize: 1000,
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,*/
    @GetUser() user: UserEntity,
    @Body('file') file: string,
  ) {
    return await this.userService.updateUserElements(user.id, { avatar: file });
  }
}
