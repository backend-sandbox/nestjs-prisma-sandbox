import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';

import { JwtStrategy } from './strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
