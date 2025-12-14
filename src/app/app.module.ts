import { PrismaModule } from '@common/prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController, AuthModule } from './auth';
import { BookmarkModule } from './bookmark';
import { TaskModule } from './task';
import { UserModule } from './user';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6229,
        autoResubscribe: true,
      },
      defaultJobOptions: {
        attempts: 3,
      },
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    BookmarkModule,
    TaskModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [],
})
export class AppModule {}
