import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { UserEntity } from '@tts-saas/database';
import { CreditTransactionEntity } from '@tts-saas/database';
import { TransactionType, SubscriptionTier } from '@tts-saas/shared-types';

interface CreditOperationResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
}

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(CreditTransactionEntity)
    private transactionsRepository: Repository<CreditTransactionEntity>,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return Number(user.credits);
  }

  async deductCredits(
    userId: string,
    amount: number,
    referenceId: string,
    description: string,
  ): Promise<CreditOperationResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.dataSource.transaction(
      'READ COMMITTED',
      async (manager: EntityManager) => {
        const userRepo = manager.getRepository(UserEntity);
        const txRepo = manager.getRepository(CreditTransactionEntity);

        const user = await userRepo
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: userId })
          .getOne();

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const currentBalance = Number(user.credits);
        if (currentBalance < amount) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${amount}, Available: ${currentBalance}`,
          );
        }

        const newBalance = currentBalance - amount;

        await userRepo.update(userId, { credits: newBalance });

        const transaction = txRepo.create({
          userId,
          type: TransactionType.USAGE,
          amount: -amount,
          balanceAfter: newBalance,
          description,
          referenceId,
        });
        await txRepo.save(transaction);

        this.logger.log(
          `Deducted ${amount} credits from user ${userId}. New balance: ${newBalance}`,
        );

        return {
          success: true,
          newBalance,
          transactionId: transaction.id,
        };
      },
    );
  }

  async addCredits(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
  ): Promise<CreditOperationResult> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    return this.dataSource.transaction(
      'READ COMMITTED',
      async (manager: EntityManager) => {
        const userRepo = manager.getRepository(UserEntity);
        const txRepo = manager.getRepository(CreditTransactionEntity);

        const user = await userRepo
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: userId })
          .getOne();

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const currentBalance = Number(user.credits);
        const newBalance = currentBalance + amount;

        await userRepo.update(userId, { credits: newBalance });

        const transaction = txRepo.create({
          userId,
          type,
          amount,
          balanceAfter: newBalance,
          description,
          referenceId: referenceId || null,
        });
        await txRepo.save(transaction);

        this.logger.log(
          `Added ${amount} credits to user ${userId}. New balance: ${newBalance}`,
        );

        return {
          success: true,
          newBalance,
          transactionId: transaction.id,
        };
      },
    );
  }

  async getTransactionHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: CreditTransactionEntity[]; total: number }> {
    const [data, total] = await this.transactionsRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async resetMonthlyCredits(userId: string): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const monthlyCredits = this.getTierMonthlyCredits(user.tier);
    await this.usersRepository.update(userId, { credits: monthlyCredits });

    const txRepo = this.transactionsRepository;
    const transaction = txRepo.create({
      userId,
      type: TransactionType.BONUS,
      amount: monthlyCredits,
      balanceAfter: monthlyCredits,
      description: 'Monthly credits reset',
    });
    await txRepo.save(transaction);

    this.logger.log(
      `Reset monthly credits for user ${userId}. New balance: ${monthlyCredits}`,
    );

    return monthlyCredits;
  }

  private getTierMonthlyCredits(tier: SubscriptionTier): number {
    switch (tier) {
      case SubscriptionTier.FREE:
        return 1000;
      case SubscriptionTier.PRO:
        return 10000;
      case SubscriptionTier.ENTERPRISE:
        return 100000;
      default:
        return 1000;
    }
  }
}
