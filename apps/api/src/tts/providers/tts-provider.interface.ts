export interface TtsResult {
  audioBuffer: Buffer;
  duration: number;
  characterCount: number;
  cost: number;
}

export interface TtsOptions {
  text: string;
  voiceId: string;
  speed?: number;
  pitch?: number;
}

export interface ITtsProvider {
  readonly name: string;
  synthesize(options: TtsOptions): Promise<TtsResult>;
}
