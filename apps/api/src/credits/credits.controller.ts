import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreditsService } from './credits.service';
import { UserEntity } from '@tts-saas/database';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: UserEntity) {
    const balance = await this.creditsService.getBalance(user.id);
    return { userId: user.id, balance, tier: user.tier };
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.creditsService.getTransactionHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return {
      transactions: result.data,
      total: result.total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
  }

  @Post('reset')
  async resetCredits(@CurrentUser() user: UserEntity) {
    const newBalance = await this.creditsService.resetMonthlyCredits(user.id);
    return { success: true, newBalance };
  }
}
