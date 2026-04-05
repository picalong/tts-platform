import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserEntity } from '@tts-saas/database';
import { TtsService } from './tts.service';
import { CreateTtsJobDto } from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import { TtsJobStatus } from '@tts-saas/shared-types';

@Controller('tts')
@UseGuards(JwtAuthGuard)
export class TtsController {
  private readonly jobProgressMap: Map<string, Subject<MessageEvent>> =
    new Map();

  constructor(
    private ttsService: TtsService,
    private eventEmitter: EventEmitter2,
  ) {
    this.eventEmitter.on(
      'tts.progress',
      (data: { jobId: string; status: string; progress: number }) => {
        const subject = this.jobProgressMap.get(data.jobId);
        if (subject) {
          subject.next({
            data: JSON.stringify({
              status: data.status,
              progress: data.progress,
            }),
          });
        }
      },
    );

    this.eventEmitter.on(
      'tts.completed',
      (data: { jobId: string; audioUrl: string }) => {
        const subject = this.jobProgressMap.get(data.jobId);
        if (subject) {
          subject.next({
            data: JSON.stringify({
              status: TtsJobStatus.COMPLETED,
              progress: 100,
              audioUrl: data.audioUrl,
            }),
          });
          subject.complete();
          this.jobProgressMap.delete(data.jobId);
        }
      },
    );

    this.eventEmitter.on(
      'tts.failed',
      (data: { jobId: string; error: string }) => {
        const subject = this.jobProgressMap.get(data.jobId);
        if (subject) {
          subject.next({
            data: JSON.stringify({
              status: TtsJobStatus.FAILED,
              progress: 0,
              error: data.error,
            }),
          });
          subject.complete();
          this.jobProgressMap.delete(data.jobId);
        }
      },
    );
  }

  @Post('generate')
  async generate(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateTtsJobDto,
  ) {
    const result = await this.ttsService.createJob(user.id, user.tier, dto);
    return {
      success: true,
      jobId: result.jobId,
      estimatedCredits: result.estimatedCredits,
      status: TtsJobStatus.PENDING,
    };
  }

  @Get('jobs')
  async getJobs(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.ttsService.getUserJobs(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );

    return {
      jobs: result.data.map((job) => ({
        id: job.id,
        status: job.status,
        text: job.text.substring(0, 50) + (job.text.length > 50 ? '...' : ''),
        creditCost: job.creditCost,
        audioUrl: job.audioUrl,
        createdAt: job.createdAt,
      })),
      total: result.total,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    };
  }

  @Get('jobs/:jobId')
  async getJob(@CurrentUser() user: UserEntity, @Param('jobId') jobId: string) {
    const job = await this.ttsService.getJobStatus(jobId, user.id);
    return {
      id: job.id,
      status: job.status,
      text: job.text,
      voiceId: job.voiceId,
      speed: job.speed,
      pitch: job.pitch,
      creditCost: job.creditCost,
      audioUrl: job.audioUrl,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  @Sse('jobs/:jobId/stream')
  streamProgress(@Param('jobId') jobId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    this.jobProgressMap.set(jobId, subject);

    return subject.asObservable();
  }
}
