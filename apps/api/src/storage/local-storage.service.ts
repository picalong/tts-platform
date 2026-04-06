import { Injectable, Logger } from '@nestjs/common';
import { IStorageService } from './storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly storageDir = path.join(process.cwd(), 'storage', 'audio');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async uploadAudio(buffer: Buffer, filename: string): Promise<string> {
    const key = `${uuidv4()}-${filename}`;
    const filePath = path.join(this.storageDir, key);

    await fs.promises.writeFile(filePath, buffer);

    this.logger.log(`Audio uploaded: ${key}`);
    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const baseUrl = process.env.API_URL || 'http://localhost:3001';
    const signedUrl = `${baseUrl}/api/audio/${key}?expires=${Date.now() + expiresIn * 1000}`;

    this.logger.debug(`Generated signed URL for: ${key}`);
    return signedUrl;
  }

  async deleteAudio(key: string): Promise<void> {
    const filePath = path.join(this.storageDir, key);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      this.logger.log(`Deleted audio: ${key}`);
    }
  }

  async getAudioBuffer(key: string): Promise<Buffer | null> {
    const filePath = path.join(this.storageDir, key);

    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath);
    }

    return null;
  }
}
