import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity, CreditTransactionEntity } from '@tts-saas/database';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { CreditResetService } from './credit-reset.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, CreditTransactionEntity])],
  providers: [CreditsService, CreditResetService],
  controllers: [CreditsController],
  exports: [CreditsService],
})
export class CreditsModule {}
