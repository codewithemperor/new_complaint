import { BadRequestException, Injectable } from '@nestjs/common';
import { TicketStatus } from '../common/types/ticket-status';

/**
 * Central ticket status transition validator.
 *
 * The ONLY place ticket status legality is checked. Feature services call
 * assertCanTransition() before mutating a ticket's status; the actual status
 * write + side effects (movements, minutes, emails) stay in the feature service.
 *
 * See planning/03-ticket-workflow.md §2 for the full transition table.
 */
@Injectable()
export class TicketStateMachine {
  private readonly transitions: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.SUBMITTED]: [TicketStatus.ACKNOWLEDGED],
    [TicketStatus.ACKNOWLEDGED]: [TicketStatus.TRIAGED],
    [TicketStatus.TRIAGED]: [TicketStatus.ASSIGNED],
    [TicketStatus.ASSIGNED]: [TicketStatus.IN_PROGRESS],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.PENDING_APPROVAL, TicketStatus.RESOLVED],
    [TicketStatus.PENDING_APPROVAL]: [TicketStatus.APPROVED, TicketStatus.IN_PROGRESS],
    [TicketStatus.APPROVED]: [TicketStatus.IN_PROGRESS],
    [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
    [TicketStatus.REOPENED]: [TicketStatus.TRIAGED],
    [TicketStatus.CLOSED]: [],
    [TicketStatus.ESCALATED]: [],
    [TicketStatus.REFERRED]: [],
  };

  canTransition(from: TicketStatus, to: TicketStatus): boolean {
    const allowed = this.transitions[from] ?? [];
    return allowed.includes(to);
  }

  assertCanTransition(from: TicketStatus, to: TicketStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(`Illegal status transition: ${from} → ${to}`);
    }
  }
}
