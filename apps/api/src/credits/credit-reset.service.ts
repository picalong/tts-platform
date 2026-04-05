import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionTier } from '@tts-saas/shared-types';

@Injectable()
export class CreditResetService implements OnModuleInit {
  private readonly logger = new Logger(CreditResetService.name);

  private readonly TIER_CREDITS: Record<SubscriptionTier, number> = {
    [SubscriptionTier.FREE]: 1000,
    [SubscriptionTier.PRO]: 10000,
    [SubscriptionTier.ENTERPRISE]: 100000,
  };

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  onModuleInit() {
    this.logger.log('Credit reset service initialized');
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyCreditReset() {
    this.logger.log('Starting monthly credit reset...');

    const users = await this.usersRepository.find({
      where: {},
      select: ['id', 'tier', 'credits'],
    });

    let resetCount = 0;
    for (const user of users) {
      try {
        const newCredits = this.TIER_CREDITS[user.tier];
        await this.usersRepository.update(user.id, { credits: newCredits });
        resetCount++;
      } catch (error) {
        this.logger.error(
          `Failed to reset credits for user ${user.id}: ${error}`,
        );
      }
    }

    this.logger.log(
      `Monthly credit reset completed. Reset ${resetCount} users.`,
    );
  }
}
