"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RemindersService", {
    enumerable: true,
    get: function() {
        return RemindersService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
let RemindersService = class RemindersService {
    constructor(prisma){
        this.prisma = prisma;
    }
    /**
   * Create a reminder for a ticket. The ticket must exist.
   */ async create(userId, dto) {
        // Verify ticket exists
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: dto.ticketId
            },
            select: {
                id: true
            }
        });
        if (!ticket) {
            throw new _common.NotFoundException(`Ticket ${dto.ticketId} not found`);
        }
        const reminder = await this.prisma.reminder.create({
            data: {
                ticketId: dto.ticketId,
                userId,
                remindAt: new Date(dto.remindAt),
                note: dto.note ?? null
            }
        });
        return this.toResponse(reminder);
    }
    /**
   * List all active reminders for the current user, sorted by remindAt ascending.
   */ async list(userId) {
        const reminders = await this.prisma.reminder.findMany({
            where: {
                userId,
                isActive: true
            },
            orderBy: {
                remindAt: 'asc'
            }
        });
        return reminders.map((r)=>this.toResponse(r));
    }
    /**
   * List all reminders for a specific ticket (user-scoped for privacy).
   */ async listByTicket(userId, ticketId) {
        const reminders = await this.prisma.reminder.findMany({
            where: {
                ticketId,
                userId,
                isActive: true
            },
            orderBy: {
                remindAt: 'asc'
            }
        });
        return reminders.map((r)=>this.toResponse(r));
    }
    /**
   * Update a reminder. Only the owner can update.
   */ async update(id, userId, dto) {
        const existing = await this.prisma.reminder.findUnique({
            where: {
                id
            }
        });
        if (!existing) {
            throw new _common.NotFoundException(`Reminder ${id} not found`);
        }
        if (existing.userId !== userId) {
            throw new _common.ForbiddenException('You can only update your own reminders');
        }
        const data = {};
        if (dto.note !== undefined) data.note = dto.note;
        if (dto.remindAt !== undefined) data.remindAt = new Date(dto.remindAt);
        if (dto.isActive !== undefined) data.isActive = dto.isActive;
        const updated = await this.prisma.reminder.update({
            where: {
                id
            },
            data
        });
        return this.toResponse(updated);
    }
    /**
   * Delete a reminder. Only the owner can delete.
   */ async delete(id, userId) {
        const existing = await this.prisma.reminder.findUnique({
            where: {
                id
            }
        });
        if (!existing) {
            throw new _common.NotFoundException(`Reminder ${id} not found`);
        }
        if (existing.userId !== userId) {
            throw new _common.ForbiddenException('You can only delete your own reminders');
        }
        await this.prisma.reminder.delete({
            where: {
                id
            }
        });
        return {
            deleted: true
        };
    }
    /**
   * Map a Prisma Reminder row to the response DTO shape.
   */ toResponse(r) {
        return {
            id: r.id,
            ticketId: r.ticketId,
            userId: r.userId,
            note: r.note,
            remindAt: r.remindAt.toISOString(),
            isActive: r.isActive,
            createdAt: r.createdAt.toISOString()
        };
    }
};
RemindersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], RemindersService);

//# sourceMappingURL=reminders.service.js.map