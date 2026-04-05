import { VoiceGender, VoiceType } from "../enums/index.js";

export interface Voice {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender: VoiceGender;
  type: VoiceType;
  previewUrl: string | null;
  creditCostPer1kChars: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
