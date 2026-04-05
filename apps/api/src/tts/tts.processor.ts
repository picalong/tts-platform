import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TtsJobEntity, VoiceEntity } from '@tts-saas/database';
import { TtsJobStatus } from '@tts-saas/shared-types';
import { TtsFactory } from './providers/tts-factory';
import { LocalStorageService } from '../storage/local-storage.service';
import { CreditsService } from '../credits/credits.service';
import { QueueJobData } from './tts.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor('tts')
export class TtsProcessor extends WorkerHost {
  private readonly logger = new Logger(TtsProcessor.name);
  private readonly metrics = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    totalLatency: 0,
    totalCost: 0,
  };

  constructor(
    @InjectRepository(TtsJobEntity)
    private ttsJobRepository: Repository<TtsJobEntity>,
    @InjectRepository(VoiceEntity)
    private voiceRepository: Repository<VoiceEntity>,
    private ttsFactory: TtsFactory,
    private storageService: LocalStorageService,
    private creditsService: CreditsService,
    private eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<QueueJobData>): Promise<void> {
    const startTime = Date.now();
    const { jobId, userId, text, voiceId, speed, pitch } = job.data;

    this.logger.log(`Processing job ${jobId}`);
    await this.updateJobStatus(jobId, TtsJobStatus.PROCESSING);

    this.eventEmitter.emit('tts.progress', {
      jobId,
      status: TtsJobStatus.PROCESSING,
      progress: 25,
    });

    try {
      const voice = await this.voiceRepository.findOne({
        where: { id: voiceId },
      });

      const providerName = voice?.provider || 'mock';

      this.eventEmitter.emit('tts.progress', {
        jobId,
        status: TtsJobStatus.PROCESSING,
        progress: 50,
      });

      const ttsResult = await this.ttsFactory.synthesize(providerName, {
        text,
        voiceId,
        speed,
        pitch,
      });

      this.eventEmitter.emit('tts.progress', {
        jobId,
        status: TtsJobStatus.PROCESSING,
        progress: 75,
      });

      const filename = `tts-${jobId}.mp3`;
      const storageKey = await this.storageService.uploadAudio(
        ttsResult.audioBuffer,
        filename,
      );
      const audioUrl = await this.storageService.getSignedUrl(storageKey);

      await this.updateJobStatus(jobId, TtsJobStatus.COMPLETED, audioUrl);

      await this.creditsService.deductCredits(
        userId,
        ttsResult.cost,
        jobId,
        `TTS job ${jobId}: ${ttsResult.characterCount} chars`,
      );

      this.eventEmitter.emit('tts.completed', {
        jobId,
        audioUrl,
        creditsUsed: ttsResult.cost,
      });

      const latency = Date.now() - startTime;
      this.metrics.processed++;
      this.metrics.succeeded++;
      this.metrics.totalLatency += latency;
      this.metrics.totalCost += ttsResult.cost;

      this.logMetrics(jobId, latency, ttsResult.cost, true);

      this.logger.log(
        `Job ${jobId} completed successfully. Latency: ${latency}ms, Cost: ${ttsResult.cost.toFixed(4)}`,
      );
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metrics.processed++;
      this.metrics.failed++;
      this.metrics.totalLatency += latency;

      this.logger.error(`Job ${jobId} failed: ${error}`);
      await this.updateJobStatus(
        jobId,
        TtsJobStatus.FAILED,
        undefined,
        error instanceof Error ? error.message : 'Unknown error',
      );

      this.eventEmitter.emit('tts.failed', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.logMetrics(jobId, latency, 0, false);
      throw error;
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: TtsJobStatus,
    audioUrl?: string,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<TtsJobEntity> = { status };
    if (audioUrl) updateData.audioUrl = audioUrl;
    if (errorMessage) updateData.errorMessage = errorMessage;

    await this.ttsJobRepository.update(jobId, updateData);
  }

  private logMetrics(
    jobId: string,
    latency: number,
    cost: number,
    success: boolean,
  ): void {
    const avgLatency =
      this.metrics.processed > 0
        ? Math.round(this.metrics.totalLatency / this.metrics.processed)
        : 0;
    const successRate =
      this.metrics.processed > 0
        ? ((this.metrics.succeeded / this.metrics.processed) * 100).toFixed(2)
        : '0.00';

    this.logger.log(
      `[Metrics] Job ${jobId}: Latency=${latency}ms, AvgLatency=${avgLatency}ms, ` +
        `SuccessRate=${successRate}%, TotalCost=${this.metrics.totalCost.toFixed(4)}`,
    );
  }
}
