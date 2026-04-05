import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionTier } from '@tts-saas/shared-types';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('tiers')
  async getAllTiers() {
    return this.subscriptionService.getAllTiers();
  }

  @Get('current')
  async getCurrentSubscription(@CurrentUser() user: UserEntity) {
    return this.subscriptionService.getUserSubscription(user.id);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  async upgrade(@CurrentUser() user: UserEntity, @Body('tier') tier: string) {
    if (!this.subscriptionService.isValidTier(tier)) {
      return { success: false, error: 'Invalid tier' };
    }
    return this.subscriptionService.upgradeTier(
      user.id,
      tier as SubscriptionTier,
    );
  }

  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  async downgrade(@CurrentUser() user: UserEntity, @Body('tier') tier: string) {
    if (!this.subscriptionService.isValidTier(tier)) {
      return { success: false, error: 'Invalid tier' };
    }
    return this.subscriptionService.downgradeTier(
      user.id,
      tier as SubscriptionTier,
    );
  }
}
