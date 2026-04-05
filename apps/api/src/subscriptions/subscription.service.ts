import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionTier } from '@tts-saas/shared-types';

export interface TierInfo {
  tier: SubscriptionTier;
  name: string;
  creditsPerMonth: number;
  features: string[];
}

const TIER_CONFIG: Record<SubscriptionTier, TierInfo> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    creditsPerMonth: 1000,
    features: ['1000 credits/month', 'Basic voices', 'Standard quality'],
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    creditsPerMonth: 10000,
    features: [
      '10000 credits/month',
      'All voices',
      'High quality',
      'Priority processing',
    ],
  },
  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    creditsPerMonth: 100000,
    features: [
      '100000 credits/month',
      'All voices',
      'Premium quality',
      'Priority processing',
      'Dedicated support',
    ],
  },
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async getTierInfo(tier: SubscriptionTier): Promise<TierInfo> {
    return TIER_CONFIG[tier];
  }

  async getAllTiers(): Promise<TierInfo[]> {
    return Object.values(TIER_CONFIG);
  }

  async getUserSubscription(userId: string): Promise<{
    tier: SubscriptionTier;
    tierInfo: TierInfo;
    credits: number;
  }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      tier: user.tier,
      tierInfo: TIER_CONFIG[user.tier],
      credits: Number(user.credits),
    };
  }

  async upgradeTier(
    userId: string,
    newTier: SubscriptionTier,
  ): Promise<{ success: boolean; newTier: SubscriptionTier; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTierIndex = Object.keys(SubscriptionTier).indexOf(user.tier);
    const newTierIndex = Object.keys(SubscriptionTier).indexOf(newTier);

    if (newTierIndex <= currentTierIndex) {
      throw new BadRequestException(
        'Cannot upgrade to a lower or same tier. Use downgrade instead.',
      );
    }

    const additionalCredits = this.calculateProration(
      user.tier,
      newTier,
      Number(user.credits),
    );

    await this.usersRepository.update(userId, { tier: newTier });

    this.logger.log(
      `User ${userId} upgraded from ${user.tier} to ${newTier}. Added ${additionalCredits} prorated credits.`,
    );

    return {
      success: true,
      newTier,
      message: `Successfully upgraded to ${TIER_CONFIG[newTier].name}. You received ${additionalCredits} prorated credits.`,
    };
  }

  async downgradeTier(
    userId: string,
    newTier: SubscriptionTier,
  ): Promise<{ success: boolean; newTier: SubscriptionTier; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentTierIndex = Object.keys(SubscriptionTier).indexOf(user.tier);
    const newTierIndex = Object.keys(SubscriptionTier).indexOf(newTier);

    if (newTierIndex >= currentTierIndex) {
      throw new BadRequestException(
        'Cannot downgrade to a higher or same tier. Use upgrade instead.',
      );
    }

    const newCredits = TIER_CONFIG[newTier].creditsPerMonth;
    await this.usersRepository.update(userId, {
      tier: newTier,
      credits: newCredits,
    });

    this.logger.log(
      `User ${userId} downgraded from ${user.tier} to ${newTier}. Credits reset to ${newCredits}.`,
    );

    return {
      success: true,
      newTier,
      message: `Successfully downgraded to ${TIER_CONFIG[newTier].name}. Your credits have been reset to ${newCredits}.`,
    };
  }

  private calculateProration(
    currentTier: SubscriptionTier,
    newTier: SubscriptionTier,
    currentCredits: number,
  ): number {
    const currentCreditsPerMonth = TIER_CONFIG[currentTier].creditsPerMonth;
    const newCreditsPerMonth = TIER_CONFIG[newTier].creditsPerMonth;
    const creditDiff = newCreditsPerMonth - currentCreditsPerMonth;

    const daysInMonth = 30;
    const dayOfMonth = new Date().getDate();
    const remainingDays = daysInMonth - dayOfMonth + 1;
    const prorationFactor = remainingDays / daysInMonth;

    const proratedCredits = Math.floor(creditDiff * prorationFactor);

    return Math.max(0, proratedCredits);
  }

  isValidTier(tier: string): tier is SubscriptionTier {
    return Object.values(SubscriptionTier).includes(tier as SubscriptionTier);
  }
}
