import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dtos/create-reminder.dto';
import { UpdateReminderDto } from './dtos/update-reminder.dto';

/**
 * RemindersService — CRUD for ticket reminders.
 *
 * Each reminder belongs to a user and a ticket. Only the owner can
 * update or delete their reminders.
 */
@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a reminder for a ticket. The ticket must exist.
   */
  async create(userId: string, dto: CreateReminderDto) {
    // Verify ticket exists
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: dto.ticketId },
      select: { id: true },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${dto.ticketId} not found`);
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        ticketId: dto.ticketId,
        userId,
        remindAt: new Date(dto.remindAt),
        note: dto.note ?? null,
      },
    });

    return this.toResponse(reminder);
  }

  /**
   * List all active reminders for the current user, sorted by remindAt ascending.
   */
  async list(userId: string) {
    const reminders = await this.prisma.reminder.findMany({
      where: { userId, isActive: true },
      orderBy: { remindAt: 'asc' },
    });

    return reminders.map((r) => this.toResponse(r));
  }

  /**
   * List all reminders for a specific ticket (user-scoped for privacy).
   */
  async listByTicket(userId: string, ticketId: string) {
    const reminders = await this.prisma.reminder.findMany({
      where: { ticketId, userId, isActive: true },
      orderBy: { remindAt: 'asc' },
    });

    return reminders.map((r) => this.toResponse(r));
  }

  /**
   * Update a reminder. Only the owner can update.
   */
  async update(id: string, userId: string, dto: UpdateReminderDto) {
    const existing = await this.prisma.reminder.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only update your own reminders');
    }

    const data: Record<string, unknown> = {};
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.remindAt !== undefined) data.remindAt = new Date(dto.remindAt);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.reminder.update({
      where: { id },
      data,
    });

    return this.toResponse(updated);
  }

  /**
   * Delete a reminder. Only the owner can delete.
   */
  async delete(id: string, userId: string) {
    const existing = await this.prisma.reminder.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Reminder ${id} not found`);
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reminders');
    }

    await this.prisma.reminder.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Map a Prisma Reminder row to the response DTO shape.
   */
  private toResponse(r: {
    id: string;
    ticketId: string;
    userId: string;
    remindAt: Date;
    note: string | null;
    isActive: boolean;
    createdAt: Date;
  }) {
    return {
      id: r.id,
      ticketId: r.ticketId,
      userId: r.userId,
      note: r.note,
      remindAt: r.remindAt.toISOString(),
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
