import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SubscriptionTier } from "@tts-saas/shared-types";
import { TtsJobEntity } from "./TtsJobEntity";
import { CreditTransactionEntity } from "./CreditTransactionEntity";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: "password_hash", length: 255 })
  passwordHash!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  credits!: number;

  @Column({
    type: "enum",
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  tier!: SubscriptionTier;

  @Column({
    name: "stripe_customer_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeCustomerId!: string | null;

  @Column({
    name: "stripe_subscription_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  stripeSubscriptionId!: string | null;

  @OneToMany(() => TtsJobEntity, (ttsJob) => ttsJob.user)
  ttsJobs!: TtsJobEntity[];

  @OneToMany(() => CreditTransactionEntity, (tx) => tx.user)
  creditTransactions!: CreditTransactionEntity[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}
