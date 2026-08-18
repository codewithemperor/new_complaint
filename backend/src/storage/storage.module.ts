import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
      inject: [ConfigService],
      useFactory: (config: ConfigService): StorageService => {
        const driver =
          config.get<string>('STORAGE_DRIVER') ??
          (config.get<string>('NODE_ENV') === 'production'
            ? 'cloudinary'
            : 'local');
        if (driver === 'cloudinary') return new CloudinaryStorageService();
        return new LocalStorageService();
      },
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
