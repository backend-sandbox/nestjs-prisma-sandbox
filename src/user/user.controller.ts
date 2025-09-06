import type { Request } from 'express';
import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    return this.userService.getMe(req.user);
  }
}
