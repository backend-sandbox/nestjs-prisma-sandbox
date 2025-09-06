import bcryptjs from 'bcryptjs';
import { ConflictException, Injectable } from '@nestjs/common';

import { AuthDto } from './dtos';
import { ERROR_CONSTANT } from 'src/constants';
import { PrismaService } from '../prisma/prisma.service';
import { mapUser } from 'src/mappers';

@Injectable({})
export class AuthService {
  constructor(private prismaService: PrismaService) {}

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

    const mappedUser = mapUser(newUser);
    return mappedUser;
  }

  signin(authDto: AuthDto) {
    return { hi: 'signin' };
  }
}
