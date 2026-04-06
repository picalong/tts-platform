import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { TransactionType } from "@tts-saas/shared-types";

@Entity("credit_transactions")
export class CreditTransactionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type!: TransactionType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({
    name: "balance_after",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  balanceAfter!: number;

  @Column({ type: "varchar", length: 500 })
  description!: string;

  @Column({
    name: "reference_id",
    type: "varchar",
    length: 36,
    nullable: true,
  })
  referenceId!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
