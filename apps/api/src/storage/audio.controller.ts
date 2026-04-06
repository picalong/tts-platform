import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { LocalStorageService } from './local-storage.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('api/audio')
@Public()
export class AudioController {
  constructor(private readonly storageService: LocalStorageService) {}

  @Get(':key')
  async serveAudio(
    @Param('key') key: string,
    @Query('expires') expires: string,
    @Res() res: Response,
  ) {
    const expiresAt = parseInt(expires, 10);
    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      throw new UnauthorizedException('Signed URL expired');
    }

    const audioBuffer = await this.storageService.getAudioBuffer(key);
    if (!audioBuffer) {
      throw new NotFoundException('Audio file not found');
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': `inline; filename="${key}"`,
    });

    res.send(audioBuffer);
  }
}
