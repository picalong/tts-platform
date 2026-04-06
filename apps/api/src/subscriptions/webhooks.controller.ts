import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Webhooks')
@Controller('api/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private stripeService: StripeService) {}

  @Post('stripe')
  @Public()
  @ApiOperation({
    summary: 'Stripe webhook endpoint',
    description: 'Handle Stripe webhook events',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleStripeWebhook(
    @Req() req: { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body is required');
    }

    try {
      await this.stripeService.handleWebhook(rawBody, signature);
    } catch (error) {
      this.logger.error(`Webhook error: ${error}`);
      throw error;
    }

    return { received: true };
  }
}
