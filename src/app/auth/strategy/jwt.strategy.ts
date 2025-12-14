import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ERROR_CONSTANT } from '../../../common/constants/error.constant';
import { mapCurrentUser } from '../../../common/mappers/current-user.mapper';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CurrentUserDto } from '../dto';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    const secretKey = configService.get<string>('JWT_SECRET');

    if (!secretKey) {
      throw new UnauthorizedException(ERROR_CONSTANT.JWT_SECRET_NOT_FOUND);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secretKey,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_CONSTANT.USER_NOT_FOUND);
    }

    return mapCurrentUser(user);
  }
}
