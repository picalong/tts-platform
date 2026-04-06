export enum VoiceGender {
  MALE = "male",
  FEMALE = "female",
  NEUTRAL = "neutral",
}

export enum VoiceType {
  STANDARD = "standard",
  NEURAL = "neural",
  PREMIUM = "premium",
}

export enum TtsJobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

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
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TtsJobResponse {
  id: string;
  status: TtsJobStatus;
  text: string;
  voiceId: string;
  audioUrl: string | null;
  creditCost: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
