import { JwtModuleOptions } from '@nestjs/jwt';

export const JwtModuleConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
};

export const RefreshJwtModuleConfig: JwtModuleOptions = {
  secret: process.env.JWT_REFRESH_SECRET,
  signOptions: { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN },
};
