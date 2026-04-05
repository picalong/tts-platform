import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreditsService } from './credits.service';
import { UserEntity } from '@tts-saas/database';

@ApiTags('Credits')
@ApiBearerAuth('JWT-auth')
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get('balance')
  @ApiOperation({
    summary: 'Get credit balance',
    description: 'Get current user credit balance and tier',
  })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@CurrentUser() user: UserEntity) {
    const balance = await this.creditsService.getBalance(user.id);
    return { userId: user.id, balance, tier: user.tier };
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Get paginated credit transaction history',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
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
  @ApiOperation({
    summary: 'Reset monthly credits',
    description: 'Reset credits based on subscription tier',
  })
  @ApiResponse({ status: 200, description: 'Credits reset successfully' })
  async resetCredits(@CurrentUser() user: UserEntity) {
    const newBalance = await this.creditsService.resetMonthlyCredits(user.id);
    return { success: true, newBalance };
  }
}
