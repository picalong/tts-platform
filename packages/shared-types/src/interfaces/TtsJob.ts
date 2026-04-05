import { TtsJobStatus } from "../enums/index.js";

export interface TtsJob {
  id: string;
  userId: string;
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  status: TtsJobStatus;
  audioUrl: string | null;
  errorMessage: string | null;
  creditCost: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
