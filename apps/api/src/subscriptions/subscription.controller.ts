import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubscriptionService } from './subscription.service';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionTier } from '@tts-saas/shared-types';

@ApiTags('Subscriptions')
@ApiBearerAuth('JWT-auth')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private subscriptionService: SubscriptionService) {}

  @Get('tiers')
  @ApiOperation({
    summary: 'Get all subscription tiers',
    description: 'List all available subscription tiers with features',
  })
  @ApiResponse({ status: 200, description: 'Tiers retrieved successfully' })
  async getAllTiers() {
    return this.subscriptionService.getAllTiers();
  }

  @Get('current')
  @ApiOperation({
    summary: 'Get current subscription',
    description: 'Get current user subscription details',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription retrieved successfully',
  })
  async getCurrentSubscription(@CurrentUser() user: UserEntity) {
    return this.subscriptionService.getUserSubscription(user.id);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upgrade subscription',
    description: 'Upgrade to a higher tier with prorated credits',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['pro', 'enterprise'], example: 'pro' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Upgrade successful' })
  @ApiResponse({ status: 400, description: 'Invalid tier or cannot downgrade' })
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
  @ApiOperation({
    summary: 'Downgrade subscription',
    description: 'Downgrade to a lower tier',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['free', 'pro'], example: 'free' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Downgrade successful' })
  @ApiResponse({ status: 400, description: 'Invalid tier or cannot upgrade' })
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
