import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { StorageService, StoredFile } from './storage.service';

/**
 * Local filesystem storage. Writes to UPLOADS_DIR (default ./uploads).
 * Used in development; production switches to CloudinaryStorageService via
 * the storage.module.ts factory.
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? './uploads');
  }

  async onModuleInit() {
    await fs.mkdir(this.uploadsDir, { recursive: true });
    this.logger.log(`Local storage ready at ${this.uploadsDir}`);
  }

  async save(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<StoredFile> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const ext = path.extname(file.originalname);
    const basename = `${crypto.randomUUID()}${ext}`;
    const relDir = path.join(String(year), month);
    const absDir = path.join(this.uploadsDir, relDir);
    await fs.mkdir(absDir, { recursive: true });

    const storedPath = path.join(relDir, basename).split(path.sep).join('/');
    await fs.writeFile(path.join(absDir, basename), file.buffer);

    return {
      storedPath,
      filename: file.originalname,
      mimetype: file.mimetype,
      sizeBytes: file.size,
    };
  }

  getUrl(storedPath: string): string {
    // Served by the static route registered in main.ts (/uploads/...).
    return `/uploads/${storedPath}`;
  }

  async delete(storedPath: string): Promise<void> {
    const abs = path.join(this.uploadsDir, storedPath);
    try {
      await fs.unlink(abs);
    } catch (err) {
      this.logger.warn(`Failed to delete ${abs}: ${(err as Error).message}`);
    }
  }
}
