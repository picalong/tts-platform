import { Injectable, Logger } from '@nestjs/common';
import { ITtsProvider, TtsOptions, TtsResult } from './tts-provider.interface';
import { MockTtsProvider } from './mock-tts.provider';

@Injectable()
export class TtsFactory {
  private readonly logger = new Logger(TtsFactory.name);
  private readonly providers: Map<string, ITtsProvider> = new Map();

  constructor(private readonly mockProvider: MockTtsProvider) {
    this.registerProvider('mock', this.mockProvider);
    this.registerProvider('google', this.mockProvider);
    this.registerProvider('openai', this.mockProvider);
    this.registerProvider('azure', this.mockProvider);
  }

  registerProvider(name: string, provider: ITtsProvider): void {
    this.providers.set(name, provider);
    this.logger.log(`Registered TTS provider: ${name}`);
  }

  async synthesize(
    providerName: string,
    options: TtsOptions,
  ): Promise<TtsResult> {
    const provider = this.providers.get(providerName);

    if (!provider) {
      this.logger.warn(
        `Provider ${providerName} not found, falling back to mock`,
      );
      return this.mockProvider.synthesize(options);
    }

    try {
      const result = await this.withTimeout(
        provider.synthesize(options),
        30000,
        `Provider ${providerName} timeout`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Provider ${providerName} failed: ${error}. Falling back to mock.`,
      );
      return this.mockProvider.synthesize(options);
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    errorMessage: string,
  ): Promise<T> {
    let timeout: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error(errorMessage)), ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeout!);
    }
  }
}
