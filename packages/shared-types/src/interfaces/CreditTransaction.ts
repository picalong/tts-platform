import { TransactionType } from "../enums/index.js";

export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId: string | null;
  createdAt: Date;
}
