import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppDataSource } from '@tts-saas/database';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CreditsModule } from './credits/credits.module';
import { SubscriptionModule } from './subscriptions/subscription.module';
import { TtsModule } from './tts/tts.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      username: process.env.MYSQL_USER || 'tts_user',
      password: process.env.MYSQL_PASSWORD || 'tts_password',
      database: process.env.MYSQL_DATABASE || 'tts_saas',
      entities: [],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    CreditsModule,
    SubscriptionModule,
    TtsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
