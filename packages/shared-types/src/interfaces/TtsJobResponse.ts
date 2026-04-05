import { TtsJobStatus } from "../enums/index.js";

export interface TtsJobResponse {
  id: string;
  status: TtsJobStatus;
  audioUrl: string | null;
  creditCost: number;
  errorMessage: string | null;
  createdAt: Date;
}
