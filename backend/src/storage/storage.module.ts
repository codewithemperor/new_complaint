import { Module } from '@nestjs/common';
import { STORAGE_SERVICE, StorageService } from './storage.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { LocalStorageService } from './local-storage.service';

/**
 * Selects the storage implementation by STORAGE_DRIVER env.
 * The rest of the app depends only on the StorageService port.
 */
@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useFactory: (): StorageService => {
        const driver = process.env.STORAGE_DRIVER ?? 'local';
        if (driver === 'cloudinary') return new CloudinaryStorageService();
        return new LocalStorageService();
      },
    },
    LocalStorageService,
    CloudinaryStorageService,
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
