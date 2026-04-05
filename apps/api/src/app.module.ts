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
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    CreditsModule,
    SubscriptionModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
