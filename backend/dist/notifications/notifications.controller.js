"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsController", {
    enumerable: true,
    get: function() {
        return NotificationsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let NotificationsController = class NotificationsController {
    constructor(prisma){
        this.prisma = prisma;
    }
    async count(user) {
        const count = await this.getActionableCount(user);
        return {
            count
        };
    }
    async list(user) {
        const items = await this.getActionableItems(user);
        return items;
    }
    async getActionableCount(user) {
        const role = user.role;
        // Admin: tickets awaiting classification
        if (role === 'ADMIN') {
            return this.prisma.ticket.count({
                where: {
                    status: 'ACKNOWLEDGED'
                }
            });
        }
        // HOD: pending approval requests addressed to them
        if (role === 'DEPARTMENT_HOD') {
            return this.prisma.approvalRequest.count({
                where: {
                    currentApproverId: user.id,
                    status: 'PENDING',
                    approverRole: 'DEPARTMENT_HOD'
                }
            });
        }
        // PS / Commissioner: escalated approvals + breached tickets
        if ([
            'PERMANENT_SECRETARY',
            'COMMISSIONER'
        ].includes(role)) {
            const escalationRole = role === 'PERMANENT_SECRETARY' ? 'PERMANENT_SECRETARY' : 'COMMISSIONER';
            const [escalated, breached] = await Promise.all([
                this.prisma.approvalRequest.count({
                    where: {
                        approverRole: escalationRole,
                        status: 'PENDING'
                    }
                }),
                this.prisma.ticket.count({
                    where: {
                        slaBreached: true,
                        status: {
                            not: 'CLOSED'
                        }
                    }
                })
            ]);
            return escalated + breached;
        }
        // Department staff: their active tickets
        if (role === 'DEPARTMENT_STAFF') {
            return this.prisma.ticket.count({
                where: {
                    assignedOfficerId: user.id,
                    status: {
                        in: [
                            'ASSIGNED',
                            'IN_PROGRESS',
                            'PENDING_APPROVAL',
                            'APPROVED',
                            'REOPENED'
                        ]
                    }
                }
            });
        }
        return 0;
    }
    async getActionableItems(user) {
        const role = user.role;
        const take = 20;
        // Admin: unclassified tickets
        if (role === 'ADMIN') {
            const tickets = await this.prisma.ticket.findMany({
                where: {
                    status: 'ACKNOWLEDGED'
                },
                orderBy: {
                    createdAt: 'asc'
                },
                take,
                select: {
                    id: true,
                    ticketCode: true,
                    subject: true,
                    status: true,
                    createdAt: true
                }
            });
            return tickets.map((t)=>({
                    id: t.id,
                    ticketCode: t.ticketCode,
                    subject: t.subject,
                    status: t.status,
                    action: 'Needs classification',
                    createdAt: t.createdAt.toISOString(),
                    link: `/dashboard/triage`
                }));
        }
        // HOD: pending approvals
        if (role === 'DEPARTMENT_HOD') {
            const approvals = await this.prisma.approvalRequest.findMany({
                where: {
                    currentApproverId: user.id,
                    status: 'PENDING',
                    approverRole: 'DEPARTMENT_HOD'
                },
                orderBy: {
                    createdAt: 'asc'
                },
                take,
                include: {
                    ticket: {
                        select: {
                            id: true,
                            ticketCode: true,
                            subject: true,
                            status: true
                        }
                    }
                }
            });
            return approvals.map((a)=>({
                    id: a.id,
                    ticketCode: a.ticket.ticketCode,
                    subject: a.ticket.subject,
                    status: a.ticket.status,
                    action: 'Approval requested',
                    createdAt: a.createdAt.toISOString(),
                    link: `/dashboard/approvals`
                }));
        }
        // PS / Commissioner: escalated approvals
        if ([
            'PERMANENT_SECRETARY',
            'COMMISSIONER'
        ].includes(role)) {
            const escalationRole = role === 'PERMANENT_SECRETARY' ? 'PERMANENT_SECRETARY' : 'COMMISSIONER';
            const approvals = await this.prisma.approvalRequest.findMany({
                where: {
                    approverRole: escalationRole,
                    status: 'PENDING'
                },
                orderBy: {
                    createdAt: 'asc'
                },
                take,
                include: {
                    ticket: {
                        select: {
                            id: true,
                            ticketCode: true,
                            subject: true,
                            status: true
                        }
                    }
                }
            });
            return approvals.map((a)=>({
                    id: a.id,
                    ticketCode: a.ticket.ticketCode,
                    subject: a.ticket.subject,
                    status: a.ticket.status,
                    action: 'Escalated for decision',
                    createdAt: a.createdAt.toISOString(),
                    link: `/dashboard/approvals`
                }));
        }
        // Department staff: their active tickets
        if (role === 'DEPARTMENT_STAFF') {
            const tickets = await this.prisma.ticket.findMany({
                where: {
                    assignedOfficerId: user.id,
                    status: {
                        in: [
                            'ASSIGNED',
                            'IN_PROGRESS',
                            'PENDING_APPROVAL',
                            'APPROVED',
                            'REOPENED'
                        ]
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                },
                take,
                select: {
                    id: true,
                    ticketCode: true,
                    subject: true,
                    status: true,
                    createdAt: true
                }
            });
            return tickets.map((t)=>({
                    id: t.id,
                    ticketCode: t.ticketCode,
                    subject: t.subject,
                    status: t.status,
                    action: t.status === 'ASSIGNED' ? 'Start investigation' : `Status: ${t.status}`,
                    createdAt: t.createdAt.toISOString(),
                    link: `/dashboard/complaints/${t.id}`
                }));
        }
        return [];
    }
};
_ts_decorate([
    (0, _common.Get)('count'),
    (0, _swagger.ApiOperation)({
        summary: 'Count of actionable items for the current user'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsController.prototype, "count", null);
_ts_decorate([
    (0, _common.Get)('list'),
    (0, _swagger.ApiOperation)({
        summary: 'List actionable items for the notification dropdown'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsController.prototype, "list", null);
NotificationsController = _ts_decorate([
    (0, _swagger.ApiTags)('notifications'),
    (0, _common.Controller)('notifications'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], NotificationsController);

//# sourceMappingURL=notifications.controller.js.map