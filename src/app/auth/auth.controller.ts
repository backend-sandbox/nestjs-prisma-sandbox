import { Body, Controller, Post, Session } from '@nestjs/common';

import { RequestWithUser } from '../../common/types';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() authDto: AuthDto) {
    return this.authService.signup(authDto);
  }

  @Post('signin')
  signin(@Body() authDto: AuthDto) {
    return this.authService.signin(authDto);
  }

  @Post('login-session')
  async loginWithSession(@Body() authDto: AuthDto, @Session() session: RequestWithUser['session']) {
    try {
      const result = await this.authService.signin(authDto);

      if (result && typeof result === 'object' && 'access_token' in result) {
        if (session) {
          session.userId = 'demo-user-id';
        }

        return {
          message: 'Session created successfully',
          sessionSet: true,
          originalResult: result,
        };
      }

      return { message: 'Login failed', sessionSet: false };
    } catch (error) {
      return {
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionSet: false,
      };
    }
  }
}
