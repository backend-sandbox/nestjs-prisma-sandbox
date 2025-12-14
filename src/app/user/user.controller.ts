import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';

import { AuthGuard } from '@common/guards';
import { CurrentUser } from '../../common/decorators';
import { CurrentUserInterceptor } from '../../common/interceptors';
import { CurrentUserData } from '../../common/types';
import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';

@UseInterceptors(CurrentUserInterceptor)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard)
  @Get('whoami')
  getMe(@CurrentUser() user: CurrentUserData | null): any {
    return this.userService.getMe(user);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserData | null) {
    if (!user) {
      return { message: 'User not found' };
    }
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Anonymous',
    };
  }

  @UseGuards(AuthGuard)
  @Get('secure-session-data')
  getSecureSessionData(@CurrentUser() user: CurrentUserData | null) {
    return {
      message: 'This is a session-protected route',
      timestamp: new Date().toISOString(),
      user: user
        ? {
            id: user.id,
            email: user.email,
          }
        : null,
      note: 'This route is protected by session-based AuthGuard',
    };
  }
}
