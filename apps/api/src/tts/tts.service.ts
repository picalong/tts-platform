import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { TtsJobEntity, VoiceEntity } from '@tts-saas/database';
import { TtsJobStatus } from '@tts-saas/shared-types';
import { CreditsService } from '../credits/credits.service';
import { CreateTtsJobDto } from './dto';

export interface QueueJobData {
  jobId: string;
  userId: string;
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  constructor(
    @InjectRepository(TtsJobEntity)
    private ttsJobRepository: Repository<TtsJobEntity>,
    @InjectRepository(VoiceEntity)
    private voiceRepository: Repository<VoiceEntity>,
    @InjectQueue('tts')
    private ttsQueue: Queue<QueueJobData>,
    private creditsService: CreditsService,
  ) {}

  async createJob(
    userId: string,
    userTier: string,
    dto: CreateTtsJobDto,
  ): Promise<{ jobId: string; estimatedCredits: number }> {
    const voice = await this.voiceRepository.findOne({
      where: { id: dto.voiceId },
    });
    if (!voice) {
      throw new NotFoundException('Voice not found');
    }

    const charCount = dto.text.length;
    const estimatedCost =
      (charCount / 1000) * Number(voice.creditCostPer1kChars);

    const currentBalance = await this.creditsService.getBalance(userId);
    if (currentBalance < estimatedCost) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${estimatedCost.toFixed(2)}, Available: ${currentBalance}`,
      );
    }

    const jobId = uuidv4();

    const ttsJob = this.ttsJobRepository.create({
      id: jobId,
      userId,
      text: dto.text,
      voiceId: dto.voiceId,
      speed: dto.speed || 1,
      pitch: dto.pitch || 0,
      status: TtsJobStatus.PENDING,
      creditCost: estimatedCost,
    });
    await this.ttsJobRepository.save(ttsJob);

    const priority =
      userTier === 'enterprise' ? 1 : userTier === 'pro' ? 5 : 10;

    await this.ttsQueue.add(
      'synthesize',
      {
        jobId,
        userId,
        text: dto.text,
        voiceId: dto.voiceId,
        speed: dto.speed || 1,
        pitch: dto.pitch || 0,
      },
      {
        jobId,
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );

    this.logger.log(
      `Created TTS job ${jobId} for user ${userId}, priority: ${priority}`,
    );

    return { jobId, estimatedCredits: estimatedCost };
  }

  async getJobStatus(jobId: string, userId: string): Promise<TtsJobEntity> {
    const job = await this.ttsJobRepository.findOne({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async getUserJobs(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: TtsJobEntity[]; total: number }> {
    const [data, total] = await this.ttsJobRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async updateJobStatus(
    jobId: string,
    status: TtsJobStatus,
    audioUrl?: string,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<TtsJobEntity> = { status };

    if (audioUrl) {
      updateData.audioUrl = audioUrl;
    }
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await this.ttsJobRepository.update(jobId, updateData);
    this.logger.log(`Updated job ${jobId} to status ${status}`);
  }
}
