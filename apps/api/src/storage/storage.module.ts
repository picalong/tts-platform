import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { AudioController } from './audio.controller';

@Module({
  controllers: [AudioController],
  providers: [LocalStorageService],
  exports: [LocalStorageService],
})
export class StorageModule {}
