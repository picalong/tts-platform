export interface IStorageService {
  uploadAudio(buffer: Buffer, filename: string): Promise<string>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteAudio(key: string): Promise<void>;
}
