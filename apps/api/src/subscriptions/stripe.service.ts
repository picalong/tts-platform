import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@tts-saas/database';
import { SubscriptionTier } from '@tts-saas/shared-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeEvent = any;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeCheckoutSession = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeSubscription = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeInvoice = any;

export const STRIPE_PRICE_IDS: Record<SubscriptionTier, string> = {
  [SubscriptionTier.FREE]: 'price_free',
  [SubscriptionTier.PRO]: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  [SubscriptionTier.ENTERPRISE]:
    process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
};

export const TIER_CREDITS: Record<
  SubscriptionTier,
  { daily: number; monthly: number }
> = {
  [SubscriptionTier.FREE]: { daily: 5000, monthly: 1000 },
  [SubscriptionTier.PRO]: { daily: 80000, monthly: 80000 },
  [SubscriptionTier.ENTERPRISE]: { daily: 300000, monthly: 300000 },
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private stripe: any;

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  getWebhookSecret(): string {
    return this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  async createCheckoutSession(
    userId: string,
    tier: SubscriptionTier,
  ): Promise<{ sessionId: string; url: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (tier === SubscriptionTier.FREE) {
      throw new BadRequestException('Cannot checkout for free tier');
    }

    const priceId = STRIPE_PRICE_IDS[tier];
    const successUrl = `${this.configService.get('WEB_URL')}/billing?success=true`;
    const cancelUrl = `${this.configService.get('WEB_URL')}/billing?canceled=true`;

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await this.usersRepository.update(userId, {
        stripeCustomerId: customerId,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        tier,
      },
    });

    this.logger.log(
      `Created checkout session for user ${userId}, tier: ${tier}`,
    );

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.configService.get('WEB_URL')}/billing`,
    });

    this.logger.log(`Created portal session for user ${userId}`);

    return { url: session.url };
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.getWebhookSecret();

    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as StripeCheckoutSession;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as StripeSubscription;
        await this.handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as StripeSubscription;
        await this.handleSubscriptionDeleted(subscription);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as StripeInvoice;
        await this.handleInvoicePaid(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as StripeInvoice;
        await this.handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: StripeCheckoutSession) {
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!userId || !tier) {
      this.logger.error('Missing metadata in checkout.session.completed');
      return;
    }

    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription,
    );

    await this.usersRepository.update(userId, {
      tier,
      stripeSubscriptionId: subscription.id,
      credits: TIER_CREDITS[tier].monthly,
    });

    this.logger.log(`User ${userId} subscribed to ${tier}`);
  }

  private async handleSubscriptionUpdated(subscription: StripeSubscription) {
    const customerId = subscription.customer;
    const user = await this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      this.logger.error(`No user found for customer ${customerId}`);
      return;
    }

    const newTier = this.mapStripeStatusToTier(
      subscription.status,
      subscription.items?.data[0]?.price?.id,
    );

    if (newTier !== user.tier) {
      await this.usersRepository.update(user.id, {
        tier: newTier,
        credits: TIER_CREDITS[newTier].monthly,
      });
      this.logger.log(`User ${user.id} tier updated to ${newTier}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: StripeSubscription) {
    const customerId = subscription.customer;
    const user = await this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      await this.usersRepository.update(user.id, {
        tier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
        credits: TIER_CREDITS[SubscriptionTier.FREE].monthly,
      });
      this.logger.log(
        `User ${user.id} subscription canceled, downgraded to free`,
      );
    }
  }

  private async handleInvoicePaid(invoice: StripeInvoice) {
    const customerId = invoice.customer;
    const user = await this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      await this.usersRepository.update(user.id, {
        credits: TIER_CREDITS[user.tier].monthly,
      });
      this.logger.log(`Invoice paid for user ${user.id}, credits reset`);
    }
  }

  private async handleInvoicePaymentFailed(invoice: StripeInvoice) {
    const customerId = invoice.customer;
    const user = await this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (user) {
      this.logger.warn(`Payment failed for user ${user.id}`);
    }
  }

  private mapStripeStatusToTier(
    status: string,
    priceId?: string,
  ): SubscriptionTier {
    if (status === 'active' || status === 'trialing') {
      if (priceId === STRIPE_PRICE_IDS[SubscriptionTier.ENTERPRISE]) {
        return SubscriptionTier.ENTERPRISE;
      }
      if (priceId === STRIPE_PRICE_IDS[SubscriptionTier.PRO]) {
        return SubscriptionTier.PRO;
      }
    }
    return SubscriptionTier.FREE;
  }

  getTierCredits(tier: SubscriptionTier): { daily: number; monthly: number } {
    return TIER_CREDITS[tier];
  }
}
