/**
 * Storage port. Feature services depend on this abstraction, not on a concrete
 * driver. The implementation is selected by STORAGE_DRIVER env.
 */

export interface StoredFile {
  storedPath: string;
  filename: string;
  mimetype: string;
  sizeBytes: number;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export abstract class StorageService {
  abstract save(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<StoredFile>;

  abstract getUrl(storedPath: string): string;

  abstract delete(storedPath: string): Promise<void>;
}
