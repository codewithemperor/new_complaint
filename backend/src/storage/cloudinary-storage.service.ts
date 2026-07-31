import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { StorageService, StoredFile } from './storage.service';

/**
 * Cloudinary storage for production. Configured lazily on first use from env.
 * Not exercised in dev (STORAGE_DRIVER=local) but kept complete so the prod
 * swap is a config change, not a code change.
 */
@Injectable()
export class CloudinaryStorageService implements StorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.configured = true;
  }

  async save(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<StoredFile> {
    this.ensureConfigured();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'kwmoc-complaints' },
        (err, res) => (err ? reject(err) : resolve(res as UploadApiResponse)),
      );
      stream.end(file.buffer);
    });
    return {
      storedPath: result.public_id,
      filename: file.originalname,
      mimetype: file.mimetype,
      sizeBytes: file.size,
    };
  }

  getUrl(storedPath: string): string {
    this.ensureConfigured();
    return cloudinary.url(storedPath, { resource_type: 'auto' });
  }

  async delete(storedPath: string): Promise<void> {
    this.ensureConfigured();
    try {
      await cloudinary.uploader.destroy(storedPath);
    } catch (err) {
      this.logger.warn(`Failed to delete ${storedPath}: ${(err as Error).message}`);
    }
  }
}
