import { Module } from '@nestjs/common';
import { ApprovalsController } from './approvals.controller';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { EscalationService } from './escalation.service';
import { DelegationsService } from './delegations.service';
import { SlaModule } from '../sla/sla.module';
import { SlaScheduler } from '../sla/sla-scheduler.service';
import { TicketsModule } from '../tickets/tickets.module';

/**
 * ApprovalsModule — owns the departmental approval chain + escalation.
 *
 * Imports SlaModule (for SlaClockService resume on decide, and SlaPolicy's
 * escalation chain) and TicketsModule (for the shared TicketStateMachine).
 *
 * SlaScheduler lives here (not in SlaModule) because it needs EscalationService
 * for auto-escalation — keeping it here avoids a SlaModule ↔ ApprovalsModule
 * circular import. EscalationService is exported so external consumers can
 * reuse advance().
 */
@Module({
  imports: [SlaModule, TicketsModule],
  controllers: [ApprovalsController],
  providers: [ApprovalWorkflowService, EscalationService, DelegationsService, SlaScheduler],
  exports: [EscalationService, ApprovalWorkflowService],
})
export class ApprovalsModule {}
