import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { CurrentUserDto } from '../dto';
import { ERROR_CONSTANT } from 'src/constants';
import { mapCurrentUser } from 'src/mappers';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const secretKey = configService.get<string>('JWT_SECRET');

    if (!secretKey) {
      throw new Error(ERROR_CONSTANT.JWT_SECRET_NOT_FOUND);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secretKey,
    });
  }

  async validate(payload: any): Promise<CurrentUserDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error(ERROR_CONSTANT.USER_NOT_FOUND);
    }

    return mapCurrentUser(user);
  }
}
