import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TtsJobEntity, VoiceEntity } from '@tts-saas/database';
import { TtsService } from './tts.service';
import { TtsController } from './tts.controller';
import { TtsProcessor } from './tts.processor';
import { MockTtsProvider } from './providers/mock-tts.provider';
import { TtsFactory } from './providers/tts-factory';
import { CreditsModule } from '../credits/credits.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'tts',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    }),
    TypeOrmModule.forFeature([TtsJobEntity, VoiceEntity]),
    CreditsModule,
    StorageModule,
  ],
  providers: [
    TtsService,
    TtsController,
    TtsProcessor,
    MockTtsProvider,
    TtsFactory,
  ],
  controllers: [TtsController],
  exports: [TtsService],
})
export class TtsModule {}
