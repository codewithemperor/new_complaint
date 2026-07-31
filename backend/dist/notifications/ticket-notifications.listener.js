"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketNotificationsListener", {
    enumerable: true,
    get: function() {
        return TicketNotificationsListener;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _notificationsservice = require("./notifications.service");
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
let TicketNotificationsListener = class TicketNotificationsListener {
    constructor(emailService, prisma){
        this.emailService = emailService;
        this.prisma = prisma;
        this.logger = new _common.Logger(TicketNotificationsListener.name);
    }
    async handleTicketCreated(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true
            }
        });
        if (!ticket || !ticket.citizen?.email) {
            this.logger.warn(`ticket.created: ticket ${payload.ticketId} has no citizen email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const trackUrl = `${appUrl}/track`;
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Complaint received — ${ticket.ticketCode}`,
            template: 'ticket-acknowledged',
            eventId: 'TICKET_ACKNOWLEDGED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                trackUrl,
                trackingPasscode: ticket.trackingPasscode,
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    async handleTicketAssigned(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                assignedOfficer: true,
                department: true
            }
        });
        if (!ticket) {
            this.logger.warn(`ticket.assigned: ticket ${payload.ticketId} not found — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        if (ticket.assignedOfficer?.email) {
            await this.emailService.send({
                to: ticket.assignedOfficer.email,
                subject: `New ticket assigned: ${ticket.ticketCode}`,
                template: 'ticket-assigned',
                eventId: 'TICKET_ASSIGNED',
                ticketId: ticket.id,
                context: {
                    ticketCode: ticket.ticketCode,
                    subject: ticket.subject,
                    priority: ticket.priority,
                    departmentName: ticket.department?.name ?? 'N/A',
                    officerName: ticket.assignedOfficer.fullName,
                    queueUrl: `${appUrl}/officer/queue`
                }
            });
        }
        if (ticket.departmentId) {
            const hod = await this.prisma.user.findFirst({
                where: {
                    departmentId: ticket.departmentId,
                    role: 'DIRECTOR',
                    isActive: true
                }
            });
            if (hod?.email) {
                await this.emailService.send({
                    to: hod.email,
                    subject: `New ticket routed to your department`,
                    template: 'ticket-routed',
                    eventId: 'TICKET_ROUTED',
                    ticketId: ticket.id,
                    context: {
                        ticketCode: ticket.ticketCode,
                        subject: ticket.subject,
                        departmentName: ticket.department?.name ?? 'N/A',
                        officerName: ticket.assignedOfficer?.fullName ?? 'Unassigned',
                        hodName: hod.fullName
                    }
                });
            }
        }
    }
    /**
   * Officer started investigation → notify the citizen (TICKET_STARTED).
   */ async handleTicketStarted(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true,
                department: true
            }
        });
        if (!ticket || !ticket.citizen?.email) {
            this.logger.warn(`ticket.started: ticket ${payload.ticketId} has no citizen email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const trackUrl = `${appUrl}/track`;
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Investigation started — ${ticket.ticketCode}`,
            template: 'ticket-started',
            eventId: 'TICKET_STARTED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                departmentName: ticket.department?.name ?? 'N/A',
                trackUrl,
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    /**
   * Officer requested more info from the citizen → INFO_REQUESTED (pauses SLA).
   */ async handleInfoRequested(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true
            }
        });
        if (!ticket || !ticket.citizen?.email) {
            this.logger.warn(`ticket.info_requested: ticket ${payload.ticketId} has no citizen email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const trackUrl = `${appUrl}/track`;
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Information requested — ${ticket.ticketCode}`,
            template: 'info-requested',
            eventId: 'INFO_REQUESTED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                requestText: payload.requestText,
                deadlineAt: payload.deadlineAt ? new Date(payload.deadlineAt).toLocaleDateString() : null,
                trackUrl,
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    /**
   * Officer requested departmental approval → APPROVAL_REQUESTED to the HOD.
   * The decision flow (approve/reject/return) is M5.
   */ async handleApprovalRequested(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                assignedOfficer: true,
                department: true
            }
        });
        if (!ticket || !ticket.departmentId) {
            this.logger.warn(`ticket.approval_requested: ticket ${payload.ticketId} has no department — skipping`);
            return;
        }
        const hod = await this.prisma.user.findFirst({
            where: {
                departmentId: ticket.departmentId,
                role: 'DIRECTOR',
                isActive: true
            }
        });
        if (!hod?.email) {
            this.logger.warn(`ticket.approval_requested: no active HOD for dept ${ticket.departmentId} — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await this.emailService.send({
            to: hod.email,
            subject: `Approval requested: ${ticket.ticketCode}`,
            template: 'approval-requested',
            eventId: 'APPROVAL_REQUESTED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                priority: ticket.priority,
                departmentName: ticket.department?.name ?? 'N/A',
                officerName: ticket.assignedOfficer?.fullName ?? 'Officer',
                hodName: hod.fullName,
                inboxUrl: `${appUrl}/hod/approvals`
            }
        });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Milestone 5 — Approval decisions & escalation
    // ─────────────────────────────────────────────────────────────────────────
    /** Approver approved → notify the assigned officer (TICKET_APPROVED). */ async handleTicketApproved(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                assignedOfficer: true
            }
        });
        if (!ticket?.assignedOfficer?.email) {
            this.logger.warn(`ticket.approved: no officer email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await this.emailService.send({
            to: ticket.assignedOfficer.email,
            subject: `Approved — ${ticket.ticketCode}`,
            template: 'ticket-approved',
            eventId: 'TICKET_APPROVED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                officerName: ticket.assignedOfficer.fullName,
                approverName: payload.approverName,
                approverRole: payload.approverRole,
                comment: payload.comment,
                queueUrl: `${appUrl}/officer/queue`
            }
        });
    }
    /** Approver returned → notify the assigned officer (TICKET_RETURNED). */ async handleTicketReturned(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                assignedOfficer: true
            }
        });
        if (!ticket?.assignedOfficer?.email) {
            this.logger.warn(`ticket.returned: no officer email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await this.emailService.send({
            to: ticket.assignedOfficer.email,
            subject: `Returned with comments — ${ticket.ticketCode}`,
            template: 'ticket-returned',
            eventId: 'TICKET_RETURNED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                officerName: ticket.assignedOfficer.fullName,
                approverName: payload.approverName,
                approverRole: payload.approverRole,
                comment: payload.comment,
                queueUrl: `${appUrl}/officer/queue`
            }
        });
    }
    /** HOD escalated → notify the PS (ESCALATION_TO_PS). */ async handleEscalationToPs(payload) {
        await this.notifyApproverTier(payload.ticketId, 'PERMANENT_SECRETARY', {
            eventId: 'ESCALATION_TO_PS',
            template: 'escalation-to-ps',
            subjectPrefix: 'Escalation to your office',
            escalatedByName: payload.escalatedByName,
            reason: payload.reason,
            inboxRoute: '/ps/inbox'
        });
    }
    /** PS escalated → notify the Commissioner (ESCALATION_TO_COMMISSIONER). */ async handleEscalationToCommissioner(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                minutes: {
                    where: {
                        isInternal: false
                    },
                    orderBy: {
                        createdAt: 'asc'
                    },
                    take: 1
                }
            }
        });
        const summary = ticket?.minutes[0]?.body?.slice(0, 200);
        await this.notifyApproverTier(payload.ticketId, 'COMMISSIONER', {
            eventId: 'ESCALATION_TO_COMMISSIONER',
            template: 'escalation-to-commissioner',
            subjectPrefix: 'Policy matter requires your direction',
            escalatedByName: payload.escalatedByName,
            reason: payload.reason,
            summary,
            inboxRoute: '/commissioner/inbox'
        });
    }
    /** PS / Commissioner decided → notify the officer + HOD (PS_DECISION / COMMISSIONER_DECISION). */ async handleApproverDecision(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                assignedOfficer: true,
                department: true
            }
        });
        if (!ticket) return;
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const eventId = payload.tier === 'COMMISSIONER' ? 'COMMISSIONER_DECISION' : 'PS_DECISION';
        const template = payload.tier === 'COMMISSIONER' ? 'commissioner-decision' : 'ps-decision';
        const recipients = [];
        if (ticket.assignedOfficer?.email) {
            recipients.push({
                email: ticket.assignedOfficer.email,
                name: ticket.assignedOfficer.fullName
            });
        }
        if (ticket.departmentId) {
            const hod = await this.prisma.user.findFirst({
                where: {
                    departmentId: ticket.departmentId,
                    role: 'DIRECTOR',
                    isActive: true
                }
            });
            if (hod?.email) recipients.push({
                email: hod.email,
                name: hod.fullName
            });
        }
        for (const r of recipients){
            await this.emailService.send({
                to: r.email,
                subject: `Directive received — ${ticket.ticketCode}`,
                template,
                eventId,
                ticketId: ticket.id,
                context: {
                    ticketCode: ticket.ticketCode,
                    subject: ticket.subject,
                    recipientName: r.name,
                    decidedByName: payload.decidedByName,
                    decision: payload.decision,
                    directive: payload.directive,
                    queueUrl: `${appUrl}/officer/queue`
                }
            });
        }
    }
    /** PS / Commissioner referred externally → notify the citizen (EXTERNAL_REFERRAL). */ async handleExternalReferral(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true
            }
        });
        if (!ticket?.citizen?.email) {
            this.logger.warn(`external.referral: no citizen email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const trackUrl = `${appUrl}/track`;
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Your complaint referred to ${payload.referredBody}`,
            template: 'external-referral',
            eventId: 'EXTERNAL_REFERRAL',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                referredBody: payload.referredBody,
                reason: payload.reason,
                trackUrl,
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    /**
   * Helper: resolve the active user occupying an approver tier (with delegation
   * substitution for PS) and send an escalation email to them.
   */ async notifyApproverTier(ticketId, role, ctx) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                id: true,
                ticketCode: true,
                subject: true
            }
        });
        if (!ticket) return;
        // Resolve the approver user (with PS delegation substitution).
        let approverEmail;
        if (role === 'PERMANENT_SECRETARY') {
            const ps = await this.prisma.user.findFirst({
                where: {
                    role: 'PERMANENT_SECRETARY',
                    isActive: true
                }
            });
            if (ps) {
                const now = new Date();
                const delegation = await this.prisma.delegation.findFirst({
                    where: {
                        delegatorId: ps.id,
                        isActive: true,
                        validFrom: {
                            lte: now
                        },
                        validTo: {
                            gte: now
                        }
                    },
                    include: {
                        delegate: true
                    }
                });
                approverEmail = delegation?.delegate?.email ?? ps.email ?? undefined;
            }
        } else {
            const commissioner = await this.prisma.user.findFirst({
                where: {
                    role: 'COMMISSIONER',
                    isActive: true
                }
            });
            approverEmail = commissioner?.email ?? undefined;
        }
        if (!approverEmail) {
            this.logger.warn(`${ctx.eventId}: no active ${role} user — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await this.emailService.send({
            to: approverEmail,
            subject: `${ctx.subjectPrefix} — ${ticket.ticketCode}`,
            template: ctx.template,
            eventId: ctx.eventId,
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                escalatedByName: ctx.escalatedByName,
                reason: ctx.reason,
                summary: ctx.summary,
                inboxUrl: `${appUrl}${ctx.inboxRoute}`
            }
        });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Milestone 6 — Resolution & Closure
    // ─────────────────────────────────────────────────────────────────────────
    /** Officer submitted a resolution → notify the citizen (TICKET_RESOLVED). */ async handleTicketResolved(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true
            }
        });
        if (!ticket?.citizen?.email) {
            this.logger.warn(`ticket.resolved: no citizen email — skipping`);
            return;
        }
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const feedbackUrl = `${appUrl}/track`;
        const graceDays = Number(process.env.FEEDBACK_GRACE_DAYS ?? 7);
        const feedbackDeadline = ticket.feedbackGraceDueAt ? new Date(ticket.feedbackGraceDueAt).toLocaleDateString() : `${graceDays} days from now`;
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Your complaint has been resolved — ${ticket.ticketCode}`,
            template: 'ticket-resolved',
            eventId: 'TICKET_RESOLVED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                resolutionText: ticket.resolutionText,
                feedbackUrl,
                feedbackDeadline,
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    /** Citizen confirmed satisfaction → CLOSED (TICKET_CLOSED to citizen). */ async handleTicketClosed(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true
            }
        });
        if (!ticket?.citizen?.email) return;
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Complaint closed — ${ticket.ticketCode}`,
            template: 'ticket-closed',
            eventId: 'TICKET_CLOSED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                closedReason: ticket.closedReason ?? 'closed',
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    /** Grace period elapsed with no feedback → auto-closed (TICKET_AUTO_CLOSED). */ async handleTicketAutoClosed(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true
            }
        });
        if (!ticket?.citizen?.email) return;
        const graceDays = Number(process.env.FEEDBACK_GRACE_DAYS ?? 7);
        await this.emailService.send({
            to: ticket.citizen.email,
            subject: `Complaint auto-closed — ${ticket.ticketCode}`,
            template: 'ticket-auto-closed',
            eventId: 'TICKET_AUTO_CLOSED',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                graceDays,
                citizenName: ticket.citizen.isAnonymous ? null : ticket.citizen.name
            }
        });
    }
    /** Citizen rejected / reopened → notify citizen, officer, admin (TICKET_REOPENED). */ async handleTicketReopened(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                citizen: true,
                assignedOfficer: true,
                department: true
            }
        });
        if (!ticket) return;
        const build = (recipientName)=>({
                ticketCode: ticket.ticketCode,
                reopenReason: payload.reopenReason,
                reopenCount: payload.reopenCount,
                citizenName: recipientName
            });
        // Citizen
        if (ticket.citizen?.email) {
            await this.emailService.send({
                to: ticket.citizen.email,
                subject: `Complaint reopened — ${ticket.ticketCode}`,
                template: 'ticket-reopened',
                eventId: 'TICKET_REOPENED',
                ticketId: ticket.id,
                context: build(ticket.citizen.isAnonymous ? null : ticket.citizen.name)
            });
        }
        // Assigned officer
        if (ticket.assignedOfficer?.email) {
            await this.emailService.send({
                to: ticket.assignedOfficer.email,
                subject: `Ticket reopened — ${ticket.ticketCode}`,
                template: 'ticket-reopened',
                eventId: 'TICKET_REOPENED',
                ticketId: ticket.id,
                context: build(ticket.assignedOfficer.fullName)
            });
        }
        // Admin complaints desk (the first ADMIN_OFFICER).
        const admin = await this.prisma.user.findFirst({
            where: {
                role: 'ADMIN_OFFICER',
                isActive: true
            }
        });
        if (admin?.email) {
            await this.emailService.send({
                to: admin.email,
                subject: `Ticket reopened — ${ticket.ticketCode}`,
                template: 'ticket-reopened',
                eventId: 'TICKET_REOPENED',
                ticketId: ticket.id,
                context: build(admin.fullName)
            });
        }
    }
    /** reopenCount >= 2 → escalate to the HOD (REOPEN_ESCALATION). */ async handleReopenEscalation(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            select: {
                id: true,
                ticketCode: true,
                subject: true,
                departmentId: true
            }
        });
        if (!ticket?.departmentId) return;
        const hod = await this.prisma.user.findFirst({
            where: {
                departmentId: ticket.departmentId,
                role: 'DIRECTOR',
                isActive: true
            }
        });
        if (!hod?.email) return;
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        await this.emailService.send({
            to: hod.email,
            subject: `Repeated reopen — review required`,
            template: 'reopen-escalation',
            eventId: 'REOPEN_ESCALATION',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                reopenCount: payload.reopenCount,
                hodName: hod.fullName,
                reviewUrl: `${appUrl}/admin/reopened`
            }
        });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Milestone 7 — SLA warning & breach
    // ─────────────────────────────────────────────────────────────────────────
    /** 80% of SLA elapsed → warn the officer + HOD (once). */ async handleSlaWarning(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            include: {
                assignedOfficer: true,
                department: true
            }
        });
        if (!ticket) return;
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const dueAt = payload.dueAt ? new Date(payload.dueAt).toLocaleString() : 'N/A';
        const recipients = [];
        if (ticket.assignedOfficer?.email) {
            recipients.push({
                email: ticket.assignedOfficer.email,
                name: ticket.assignedOfficer.fullName
            });
        }
        if (ticket.departmentId) {
            const hod = await this.prisma.user.findFirst({
                where: {
                    departmentId: ticket.departmentId,
                    role: 'DIRECTOR',
                    isActive: true
                }
            });
            if (hod?.email) recipients.push({
                email: hod.email,
                name: hod.fullName
            });
        }
        for (const r of recipients){
            await this.emailService.send({
                to: r.email,
                subject: `SLA warning — ${ticket.ticketCode}`,
                template: 'sla-warning',
                eventId: 'SLA_WARNING',
                ticketId: ticket.id,
                context: {
                    ticketCode: ticket.ticketCode,
                    subject: ticket.subject,
                    percentElapsed: payload.percentElapsed,
                    dueAt,
                    officerName: r.name,
                    queueUrl: `${appUrl}/officer/queue`
                }
            });
        }
    }
    /** SLA breached → notify the next-tier approver. */ async handleSlaBreach(payload) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: payload.ticketId
            },
            select: {
                id: true,
                ticketCode: true,
                subject: true,
                departmentId: true
            }
        });
        if (!ticket) return;
        // Resolve the approver user for the escalated tier (reuse the same logic
        // as the escalation emails — DIRECTOR by department, PS/COMMISSIONER global).
        let approverEmail;
        let approverName = 'Approver';
        if (payload.escalatedToRole === 'DIRECTOR' && ticket.departmentId) {
            const hod = await this.prisma.user.findFirst({
                where: {
                    departmentId: ticket.departmentId,
                    role: 'DIRECTOR',
                    isActive: true
                }
            });
            approverEmail = hod?.email;
            approverName = hod?.fullName ?? approverName;
        } else if (payload.escalatedToRole === 'PERMANENT_SECRETARY') {
            const ps = await this.prisma.user.findFirst({
                where: {
                    role: 'PERMANENT_SECRETARY',
                    isActive: true
                }
            });
            approverEmail = ps?.email;
            approverName = ps?.fullName ?? approverName;
        } else {
            const c = await this.prisma.user.findFirst({
                where: {
                    role: 'COMMISSIONER',
                    isActive: true
                }
            });
            approverEmail = c?.email;
            approverName = c?.fullName ?? approverName;
        }
        if (!approverEmail) return;
        const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
        const inboxRoute = payload.escalatedToRole === 'COMMISSIONER' ? '/commissioner/inbox' : payload.escalatedToRole === 'PERMANENT_SECRETARY' ? '/ps/inbox' : '/hod/approvals';
        await this.emailService.send({
            to: approverEmail,
            subject: `SLA breach escalation — ${ticket.ticketCode}`,
            template: 'sla-breach-escalation',
            eventId: 'SLA_BREACH_ESCALATION',
            ticketId: ticket.id,
            context: {
                ticketCode: ticket.ticketCode,
                subject: ticket.subject,
                approverName,
                escalatedToRole: payload.escalatedToRole,
                breachedAt: new Date().toLocaleString(),
                inboxUrl: `${appUrl}${inboxRoute}`
            }
        });
    }
};
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.created'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketCreated", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.assigned'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketAssigned", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.started'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketStarted", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.info_requested'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleInfoRequested", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.approval_requested'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleApprovalRequested", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.approved'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketApproved", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.returned'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketReturned", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('escalation.to.ps'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleEscalationToPs", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('escalation.to.commissioner'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleEscalationToCommissioner", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('approver.decision'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleApproverDecision", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('external.referral'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleExternalReferral", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.resolved'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketResolved", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.closed'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketClosed", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.auto.closed'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketAutoClosed", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.reopened'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleTicketReopened", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('ticket.reopen_escalation'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleReopenEscalation", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('sla.warning'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleSlaWarning", null);
_ts_decorate([
    (0, _eventemitter.OnEvent)('sla.breach'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TicketNotificationsListener.prototype, "handleSlaBreach", null);
TicketNotificationsListener = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _notificationsservice.EmailService === "undefined" ? Object : _notificationsservice.EmailService,
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], TicketNotificationsListener);

//# sourceMappingURL=ticket-notifications.listener.js.map