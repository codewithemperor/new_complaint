import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlaPolicy } from '../sla/sla-policy';
import { Role } from '../common/types/role';
import { ApproverRole } from '../common/types/ticket-status';

/**
 * EscalationService — advances an approval request one tier up the chain.
 *
 * Built here (M5) and reused by M7's SLA-breach auto-escalation. The chain
 * comes from SlaPolicy.escalationChain(priority) so the policy owns precedence;
 * this service only walks it.
 *
 * Delegation: when advancing to PERMANENT_SECRETARY, resolveApprover() checks
 * for an active Delegation (PS → Director) and substitutes the delegate.
 */
@Injectable()
export class EscalationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slaPolicy: SlaPolicy,
  ) {}

  /**
   * Advance the current approval request one tier. Writes the role/user change
   * and a TicketMovement. Does NOT change ticket.status (it stays
   * PENDING_APPROVAL). Throws ConflictException if already at the top tier.
   */
  async advance(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    ticketId: string,
    escalatedById: string,
    reason?: string,
  ): Promise<{ newApproverRole: ApproverRole; newApproverId: string | null }> {
    const ticket = await tx.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, priority: true, departmentId: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // The active (PENDING) approval request.
    const request = await tx.approvalRequest.findFirst({
      where: { ticketId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (!request) {
      throw new ConflictException('No pending approval request to escalate.');
    }

    const chain = this.slaPolicy.escalationChain(ticket.priority as any);
    const currentRole = request.approverRole as ApproverRole;
    const currentIdx = chain.indexOf(currentRole as unknown as Role);
    const nextRole = chain[currentIdx + 1] as unknown as ApproverRole | undefined;

    if (!nextRole) {
      throw new ConflictException('Already at the top approval tier.');
    }

    const nextApproverId = await this.resolveApprover(nextRole, ticket.departmentId ?? null);

    await tx.approvalRequest.update({
      where: { id: request.id },
      data: {
        approverRole: nextRole,
        currentApproverId: nextApproverId,
      },
    });

    await tx.ticketMovement.create({
      data: {
        ticketId,
        type: 'ESCALATED',
        fromUserId: escalatedById,
        toUserId: nextApproverId,
        note: reason ?? `Escalated to ${nextRole}`,
      },
    });

    return { newApproverRole: nextRole, newApproverId: nextApproverId };
  }

  /**
   * Resolve the user occupying an approver role for a ticket.
   *  - DIRECTOR → the department's active DIRECTOR (HOD)
   *  - PERMANENT_SECRETARY → the active PS user, or their delegate if a
   *    Delegation covers the current moment.
   *  - COMMISSIONER → the active COMMISSIONER user.
   */
  async resolveApprover(
    role: ApproverRole,
    departmentId: string | null,
  ): Promise<string | null> {
    if (role === ApproverRole.DIRECTOR) {
      if (!departmentId) return null;
      const hod = await this.prisma.user.findFirst({
        where: { departmentId, role: Role.DIRECTOR, isActive: true },
      });
      return hod?.id ?? null;
    }

    if (role === ApproverRole.PERMANENT_SECRETARY) {
      const ps = await this.prisma.user.findFirst({
        where: { role: Role.PERMANENT_SECRETARY, isActive: true },
      });
      if (!ps) return null;

      // Check for an active delegation by this PS.
      const now = new Date();
      const delegation = await this.prisma.delegation.findFirst({
        where: {
          delegatorId: ps.id,
          isActive: true,
          validFrom: { lte: now },
          validTo: { gte: now },
        },
      });
      return delegation?.delegateId ?? ps.id;
    }

    // COMMISSIONER
    const commissioner = await this.prisma.user.findFirst({
      where: { role: Role.COMMISSIONER, isActive: true },
    });
    return commissioner?.id ?? null;
  }
}
