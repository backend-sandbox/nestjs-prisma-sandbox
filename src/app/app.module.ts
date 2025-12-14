import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@common/prisma/prisma.module';
import { AuthController, AuthModule } from './auth';
import { BookmarkModule } from './bookmark';
import { UserModule } from './user';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    AuthModule,
    UserModule,
    BookmarkModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [],
})
export class AppModule {}
