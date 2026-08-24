export interface UploadFileOptions {
  tenantId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StorageResult {
  url: string;
  storageKey: string;
  provider: string;
}

export interface StorageService {
  upload(options: UploadFileOptions): Promise<StorageResult>;
  delete(storageKey: string): Promise<boolean>;
  getUrl(storageKey: string): Promise<string>;
}

export const STORAGE_SERVICE = 'STORAGE_SERVICE';
