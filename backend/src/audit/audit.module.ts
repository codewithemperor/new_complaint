import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { ReportsService } from './reports.service';

/**
 * AuditModule — global so any feature service can inject AuditService without
 * importing this module. Owns the append-only audit log + performance reports.
 */
@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, ReportsService],
  exports: [AuditService, ReportsService],
})
export class AuditModule {}
