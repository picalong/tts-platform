import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
