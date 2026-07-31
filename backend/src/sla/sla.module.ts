import { Module } from '@nestjs/common';
import { SlaPolicy } from './sla-policy';
import { SlaClockService } from './sla-clock.service';
import { SlaController } from './sla.controller';

/**
 * SlaModule — owns SLA policy + clock lifecycle + dashboards.
 *
 * Exposed to TicketsModule (and M7's breach cron) so the elapsed/pause math
 * lives in exactly one place. See planning/05-sla-matrix.md.
 */
@Module({
  controllers: [SlaController],
  providers: [SlaPolicy, SlaClockService],
  exports: [SlaPolicy, SlaClockService],
})
export class SlaModule {}
