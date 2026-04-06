import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { TtsJobStatus } from "@tts-saas/shared-types";

@Entity("tts_jobs")
export class TtsJobEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 36 })
  userId!: string;

  @Column({ type: "text" })
  text!: string;

  @Column({ name: "voice_id", type: "varchar", length: 36 })
  voiceId!: string;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 1.0 })
  speed!: number;

  @Column({ type: "decimal", precision: 4, scale: 2, default: 0.0 })
  pitch!: number;

  @Column({
    type: "enum",
    enum: TtsJobStatus,
    default: TtsJobStatus.PENDING,
  })
  status!: TtsJobStatus;

  @Column({ name: "audio_url", type: "varchar", length: 1024, nullable: true })
  audioUrl!: string | null;

  @Column({
    name: "error_message",
    type: "text",
    nullable: true,
  })
  errorMessage!: string | null;

  @Column({ name: "credit_cost", type: "decimal", precision: 10, scale: 2 })
  creditCost!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", nullable: true })
  deletedAt!: Date | null;
}
