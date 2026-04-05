import { SubscriptionTier } from "../enums/index.js";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  credits: number;
  tier: SubscriptionTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
