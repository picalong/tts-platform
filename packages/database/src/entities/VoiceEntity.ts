import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { VoiceGender, VoiceType } from "@tts-saas/shared-types";

@Entity("voices")
export class VoiceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100 })
  provider!: string;

  @Column({ length: 10 })
  language!: string;

  @Column({
    type: "enum",
    enum: VoiceGender,
  })
  gender!: VoiceGender;

  @Column({
    type: "enum",
    enum: VoiceType,
  })
  type!: VoiceType;

  @Column({
    name: "preview_url",
    type: "varchar",
    length: 1024,
    nullable: true,
  })
  previewUrl!: string | null;

  @Column({
    name: "credit_cost_per_1k_chars",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 1,
  })
  creditCostPer1kChars!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
