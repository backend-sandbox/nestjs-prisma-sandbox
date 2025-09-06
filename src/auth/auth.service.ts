import bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { AuthDto, TokenPayloadDto } from './dto';
import { mapUserToTokenPayload } from 'src/mappers';
import { PrismaService } from '../prisma/prisma.service';
import { ERROR_CONSTANT, SUCCESS_CONSTANT } from 'src/constants';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(authDto: AuthDto) {
    const { email, password } = authDto;

    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException(ERROR_CONSTANT.EMAIL_ALREADY_IN_USE);
    }

    const passwordHash = bcryptjs.hashSync(password, 10);

    const newUser = await this.prismaService.user.create({
      data: {
        email,
        password: passwordHash,
      },
    });

    const tokenPayloadUser = mapUserToTokenPayload({
      id: newUser.id,
      email: newUser.email,
    });

    return {
      message: SUCCESS_CONSTANT.SIGN_UP_SUCCESS,
      accessToken: await this.signToken(tokenPayloadUser),
    };
  }

  async signin(authDto: AuthDto) {
    const { email, password } = authDto;

    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      throw new BadRequestException(ERROR_CONSTANT.INVALID_CREDENTIALS);
    }

    const isPasswordValid = bcryptjs.compareSync(
      password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(ERROR_CONSTANT.INVALID_CREDENTIALS);
    }

    const tokenPayloadUser = mapUserToTokenPayload({
      id: existingUser.id,
      email: existingUser.email,
    });

    return {
      message: SUCCESS_CONSTANT.SIGN_IN_SUCCESS,
      accessToken: await this.signToken(tokenPayloadUser),
    };
  }

  private async signToken(tokenPayloadDto: TokenPayloadDto): Promise<string> {
    const { id, email } = tokenPayloadDto;

    const payload = {
      sub: id,
      email,
    };

    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      secret: this.configService.get<string>('JWT_SECRET'),
    });
  }
}
