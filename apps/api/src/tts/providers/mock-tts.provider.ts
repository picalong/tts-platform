import { Injectable, Logger } from '@nestjs/common';
import { ITtsProvider, TtsOptions, TtsResult } from './tts-provider.interface';

@Injectable()
export class MockTtsProvider implements ITtsProvider {
  private readonly logger = new Logger(MockTtsProvider.name);
  readonly name = 'mock';

  async synthesize(options: TtsOptions): Promise<TtsResult> {
    const startTime = Date.now();

    const charCount = options.text.length;
    const estimatedDuration = Math.ceil(charCount / 10);
    const cost = charCount / 1000;

    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000),
    );

    const mockMp3Header = Buffer.from([
      0xff, 0xfb, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    const paddingSize = Math.max(1024, charCount * 2);
    const audioBuffer = Buffer.concat([
      mockMp3Header,
      Buffer.alloc(paddingSize).fill(Math.floor(Math.random() * 256)),
    ]);

    const latency = Date.now() - startTime;

    this.logger.log(
      `Mock TTS generated: ${charCount} chars -> ${audioBuffer.length} bytes, ` +
        `duration: ${estimatedDuration}s, cost: ${cost.toFixed(4)}, latency: ${latency}ms`,
    );

    return {
      audioBuffer,
      duration: estimatedDuration,
      characterCount: charCount,
      cost,
    };
  }
}
