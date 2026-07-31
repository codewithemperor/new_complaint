import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { MovementType } from '../common/types/ticket-status';

@Injectable()
export class RoutingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async resolve(input: { category: string; priority?: string; lga?: string }): Promise<{
    departmentId: string;
    officerId?: string;
  } | null> {
    const rule = await this.prisma.routingRule.findFirst({
      where: {
        category: input.category,
        isActive: true,
        OR: [
          { priority: input.priority as any, lga: input.lga ?? null },
          { priority: input.priority as any, lga: null },
          { priority: null, lga: input.lga ?? null },
          { priority: null, lga: null },
        ],
      },
      orderBy: { priorityRank: 'desc' },
    });

    if (!rule) return null;

    let officerId = rule.defaultOfficerId ?? undefined;

    if (!officerId) {
      const fallbackOfficer = await this.prisma.user.findFirst({
        where: {
          departmentId: rule.departmentId,
          role: 'SCHEDULE_OFFICER',
          isActive: true,
        },
      });
      officerId = fallbackOfficer?.id;

      if (!officerId) {
        const fallbackHod = await this.prisma.user.findFirst({
          where: {
            departmentId: rule.departmentId,
            role: 'DIRECTOR',
            isActive: true,
          },
        });
        officerId = fallbackHod?.id;
      }
    }

    return { departmentId: rule.departmentId, officerId };
  }

  async assign(
    tx: any,
    ticketId: string,
    departmentId: string,
    officerId: string | undefined,
    triagedById: string,
    note?: string,
  ): Promise<void> {
    await tx.ticket.update({
      where: { id: ticketId },
      data: {
        departmentId,
        assignedOfficerId: officerId ?? null,
        status: 'ASSIGNED',
      },
    });

    await tx.ticketMovement.create({
      data: {
        ticketId,
        type: MovementType.ASSIGNED,
        fromUserId: triagedById,
        toUserId: officerId ?? null,
        note: note ?? `Assigned to department`,
      },
    });
  }

  async emitAssigned(ticketId: string): Promise<void> {
    this.eventEmitter.emit('ticket.assigned', { ticketId });
  }
}
