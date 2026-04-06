import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionService } from './subscription.service';
import { StripeService } from './stripe.service';
import { SubscriptionController } from './subscription.controller';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [SubscriptionService, StripeService],
  controllers: [SubscriptionController, WebhooksController],
  exports: [SubscriptionService, StripeService],
})
export class SubscriptionModule {}
