"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketsService", {
    enumerable: true,
    get: function() {
        return TicketsService;
    }
});
const _common = require("@nestjs/common");
const _eventemitter = require("@nestjs/event-emitter");
const _config = require("@nestjs/config");
const _prismaservice = require("../prisma/prisma.service");
const _ticketidgenerator = require("./ticket-id-generator");
const _trackingtokenservice = require("./tracking-token.service");
const _ticketstatemachine = require("./ticket-state-machine");
const _storageservice = require("../storage/storage.service");
const _ticketstatus = require("../common/types/ticket-status");
const _routingservice = require("../routing/routing.service");
const _slaclockservice = require("../sla/sla-clock.service");
const _auditservice = require("../audit/audit.service");
const _auditeventtype = require("../audit/audit-event-type");
const _role = require("../common/types/role");
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
const DEFAULT_PUBLIC_CATEGORY = 'Pending classification';
let TicketsService = class TicketsService {
    constructor(prisma, idGenerator, trackingTokenService, stateMachine, eventEmitter, routingService, slaClock, config, audit, storage){
        this.prisma = prisma;
        this.idGenerator = idGenerator;
        this.trackingTokenService = trackingTokenService;
        this.stateMachine = stateMachine;
        this.eventEmitter = eventEmitter;
        this.routingService = routingService;
        this.slaClock = slaClock;
        this.config = config;
        this.audit = audit;
        this.storage = storage;
    }
    /**
   * Creates a ticket + citizen + attachments atomically, then emits the
   * ticket.created event (→ acknowledgement email).
   *
   * Status is persisted directly as ACKNOWLEDGED (SUBMITTED → ACKNOWLEDGED
   * happens in one breath per the spec; we audit via the created event).
   */ async create(dto, attachments = [], uploadedById) {
        // Per M2 open-question #2: require email even if anonymous, so we can send
        // the tracking link. Anonymous just hides the name.
        if (!dto.isAnonymous && !dto.name) {
            throw new _common.BadRequestException('Name is required for non-anonymous complaints');
        }
        if (!dto.email) {
            throw new _common.BadRequestException('Email is required to receive the tracking link');
        }
        const result = await this.prisma.$transaction(async (tx)=>{
            // 1. Upsert citizen by email (a returning complainant reuses their row).
            // dto.email is guaranteed defined by the check above.
            const email = dto.email;
            const citizen = await tx.citizen.upsert({
                where: {
                    email
                },
                update: {
                    name: dto.isAnonymous ? null : dto.name,
                    phone: dto.phone,
                    lga: dto.lga
                },
                create: {
                    email,
                    name: dto.isAnonymous ? null : dto.name,
                    phone: dto.phone,
                    lga: dto.lga,
                    isAnonymous: dto.isAnonymous ?? false
                }
            });
            // 2. Generate atomic ticket code.
            const ticketCode = await this.idGenerator.nextCode(tx);
            // 3. Pre-sign the tracking token (needs the citizenId + ticketId).
            //    We use the ticketCode-based lookup later, so the token can be signed
            //    after the ticket exists. Sign below after the insert returns an id.
            // Generate a 6-digit passcode for citizen tracking (simpler than JWT URL).
            const trackingPasscode = String(Math.floor(100000 + Math.random() * 900000));
            const ticket = await tx.ticket.create({
                data: {
                    ticketCode,
                    status: _ticketstatus.TicketStatus.ACKNOWLEDGED,
                    category: dto.category ?? DEFAULT_PUBLIC_CATEGORY,
                    priority: dto.priority,
                    subject: dto.subject,
                    description: dto.description,
                    channel: dto.channel ?? _ticketstatus.Channel.WEB,
                    lga: dto.lga,
                    citizenId: citizen.id,
                    trackingPasscode,
                    // trackingToken set below via update (needs the id for the JWT).
                    trackingToken: 'pending'
                }
            });
            // 4. Sign tracking token now that we have ticketId + citizenId.
            const trackingToken = this.trackingTokenService.issue({
                ticketId: ticket.id,
                citizenId: citizen.id
            });
            await tx.ticket.update({
                where: {
                    id: ticket.id
                },
                data: {
                    trackingToken
                }
            });
            // 5. Store attachments.
            if (attachments.length > 0) {
                await tx.ticketAttachment.createMany({
                    data: attachments.map((a)=>({
                            ticketId: ticket.id,
                            kind: 'EVIDENCE',
                            filename: a.filename,
                            storedPath: a.storedPath,
                            mimetype: a.mimetype,
                            sizeBytes: a.sizeBytes,
                            uploadedById: uploadedById ?? null
                        }))
                });
            }
            return {
                id: ticket.id,
                ticketCode,
                trackingPasscode
            };
        });
        // 6. Emit event AFTER transaction commits → notification listener sends email.
        this.eventEmitter.emit('ticket.created', {
            ticketId: result.id
        });
        await this.audit.log({
            ticketId: result.id,
            eventType: _auditeventtype.AuditEventType.TICKET_ACKNOWLEDGED
        });
        return result;
    }
    /**
   * Triage: classify, prioritize, and route an ACKNOWLEDGED ticket.
   * Transitions ACKNOWLEDGED → TRIAGED → ASSIGNED atomically.
   */ async triage(ticketId, dto, triagedBy) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        // A re-assignment of an already-triaged ticket (departmentId provided, ticket
        // past ACKNOWLEDGED) skips the forward-transition check so admins/HODs can
        // move an in-flight ticket between departments.
        const isReassign = !!dto.departmentId && ![
            'ACKNOWLEDGED',
            'SUBMITTED'
        ].includes(ticket.status);
        if (!isReassign) {
            this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.TRIAGED);
        }
        let routingResult;
        if (dto.departmentId && dto.overrideOfficerId) {
            routingResult = {
                departmentId: dto.departmentId,
                officerId: dto.overrideOfficerId
            };
        } else if (dto.departmentId) {
            const fallbackOfficer = await this.prisma.user.findFirst({
                where: {
                    departmentId: dto.departmentId,
                    role: 'DEPARTMENT_STAFF',
                    isActive: true
                }
            });
            routingResult = {
                departmentId: dto.departmentId,
                officerId: fallbackOfficer?.id ?? (await this.prisma.user.findFirst({
                    where: {
                        departmentId: dto.departmentId,
                        role: 'DEPARTMENT_HOD',
                        isActive: true
                    }
                }))?.id
            };
        } else {
            const resolved = await this.routingService.resolve({
                category: dto.category ?? ticket.category ?? '',
                priority: dto.priority,
                lga: ticket.lga ?? undefined
            });
            if (!resolved) {
                throw new _common.BadRequestException(`No routing rule found for category "${dto.category}". Assign a department manually or create a routing rule.`);
            }
            routingResult = resolved;
        }
        const now = new Date();
        await this.prisma.$transaction(async (tx)=>{
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: isReassign ? ticket.status : 'TRIAGED',
                    category: dto.category ?? ticket.category,
                    priority: dto.priority ?? ticket.priority,
                    sensitivity: dto.sensitivity ?? ticket.sensitivity,
                    triagedAt: now,
                    triagedById: triagedBy.id
                }
            });
            await tx.ticketMovement.create({
                data: {
                    ticketId,
                    type: isReassign ? _ticketstatus.MovementType.REASSIGNED : _ticketstatus.MovementType.ROUTED,
                    fromUserId: triagedBy.id,
                    note: dto.triageNote ?? (isReassign ? `Reassigned to department` : `Triaged as ${dto.category ?? ticket.category} / ${dto.priority ?? ticket.priority}`)
                }
            });
            await this.routingService.assign(tx, ticketId, routingResult.departmentId, routingResult.officerId, triagedBy.id, dto.overrideOfficerId ? 'Manual assignment override' : undefined);
        });
        this.eventEmitter.emit('ticket.triaged', {
            ticketId
        });
        await this.routingService.emitAssigned(ticketId);
        await this.audit.log({
            ticketId,
            actorId: triagedBy.id,
            eventType: _auditeventtype.AuditEventType.TICKET_TRIAGED,
            meta: {
                category: dto.category,
                priority: dto.priority
            }
        });
        return {
            ticketCode: ticket.ticketCode,
            status: 'ASSIGNED'
        };
    }
    /**
   * Public tracking lookup by ticket code + passcode (no JWT needed).
   * Returns the same citizen-safe subset as findByCodeForCitizen.
   */ async findByCodeWithPasscode(ticketCode, passcode) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                ticketCode
            },
            include: {
                attachments: {
                    select: {
                        id: true,
                        filename: true,
                        storedPath: true,
                        mimetype: true,
                        sizeBytes: true,
                        kind: true,
                        uploadedAt: true
                    }
                },
                movements: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    select: {
                        type: true,
                        note: true,
                        createdAt: true
                    }
                },
                minutes: {
                    where: {
                        isInternal: false
                    },
                    orderBy: {
                        createdAt: 'asc'
                    },
                    select: {
                        body: true,
                        isResolutionDraft: true,
                        createdAt: true,
                        author: {
                            select: {
                                fullName: true,
                                designation: true
                            }
                        }
                    }
                },
                department: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!ticket || ticket.trackingPasscode !== passcode) {
            throw new _common.NotFoundException('Ticket not found or invalid passcode');
        }
        let infoRequest = null;
        if (ticket.awaiting === _ticketstatus.AwaitingState.CITIZEN) {
            const req = await this.prisma.minute.findFirst({
                where: {
                    ticketId: ticket.id,
                    isInternal: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    body: true,
                    createdAt: true
                }
            });
            if (req) {
                infoRequest = {
                    text: req.body.replace(/^\[Info requested from citizen\]\s*/, ''),
                    createdAt: req.createdAt.toISOString()
                };
            }
        }
        return {
            ticketCode: ticket.ticketCode,
            status: ticket.status,
            subject: ticket.subject,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            departmentName: ticket.department?.name ?? null,
            awaiting: ticket.awaiting,
            createdAt: ticket.createdAt,
            resolvedAt: ticket.resolvedAt,
            resolutionText: ticket.resolutionText,
            attachments: this.mapAttachmentViews(ticket.attachments),
            minutes: ticket.minutes,
            infoRequest,
            timeline: ticket.movements.map((m)=>({
                    type: m.type,
                    note: m.note,
                    createdAt: m.createdAt
                }))
        };
    }
    /**
   * Public tracking view (token-authenticated). Returns a citizen-safe subset —
   * no internal fields, no trackingToken, no staff-only data.
   */ async findByCodeForCitizen(ticketCode, citizenId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                ticketCode
            },
            include: {
                attachments: {
                    select: {
                        id: true,
                        filename: true,
                        storedPath: true,
                        mimetype: true,
                        sizeBytes: true,
                        kind: true,
                        uploadedAt: true
                    }
                },
                movements: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    select: {
                        type: true,
                        note: true,
                        createdAt: true
                    }
                },
                minutes: {
                    // Only non-internal minutes are citizen-visible. The officer's
                    // internal commentary stays staff-only.
                    where: {
                        isInternal: false
                    },
                    orderBy: {
                        createdAt: 'asc'
                    },
                    select: {
                        body: true,
                        isResolutionDraft: true,
                        createdAt: true,
                        author: {
                            select: {
                                fullName: true,
                                designation: true
                            }
                        }
                    }
                },
                department: {
                    select: {
                        name: true
                    }
                }
            }
        });
        if (!ticket || ticket.citizenId !== citizenId) {
            throw new _common.NotFoundException('Ticket not found');
        }
        // If the ticket is awaiting a citizen reply, surface the latest info
        // request text (extracted from the internal minute written on request).
        let infoRequest = null;
        if (ticket.awaiting === _ticketstatus.AwaitingState.CITIZEN) {
            const req = await this.prisma.minute.findFirst({
                where: {
                    ticketId: ticket.id,
                    isInternal: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    body: true,
                    createdAt: true
                }
            });
            if (req) {
                infoRequest = {
                    text: req.body.replace(/^\[Info requested from citizen\]\s*/, ''),
                    createdAt: req.createdAt.toISOString()
                };
            }
        }
        return {
            ticketCode: ticket.ticketCode,
            status: ticket.status,
            subject: ticket.subject,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            departmentName: ticket.department?.name ?? null,
            awaiting: ticket.awaiting,
            createdAt: ticket.createdAt,
            resolvedAt: ticket.resolvedAt,
            resolutionText: ticket.resolutionText,
            attachments: this.mapAttachmentViews(ticket.attachments),
            minutes: ticket.minutes,
            infoRequest,
            timeline: ticket.movements.map((m)=>({
                    type: m.type,
                    note: m.note,
                    createdAt: m.createdAt
                }))
        };
    }
    /**
   * Staff view (JWT-authenticated). Returns full ticket detail.
   */ async findById(id) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            },
            include: {
                citizen: true,
                attachments: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                assignedOfficer: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                        designation: true,
                        email: true
                    }
                },
                movements: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    include: {
                        fromUser: {
                            select: {
                                fullName: true,
                                role: true
                            }
                        },
                        toUser: {
                            select: {
                                fullName: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        return ticket;
    }
    /**
   * Staff list with filters. Used by triage queue (M3), officer queue (M4), etc.
   * The sentinel `assignedOfficerId=me` is resolved to the requesting user's id
   * so officers can fetch their own queue without exposing their UUID.
   */ async findMany(filters) {
        const { status, departmentId, page = 1, pageSize = 20 } = filters;
        const where = {};
        if (status) where.status = status;
        if (departmentId) where.departmentId = departmentId;
        if (filters.assignedOfficerId) {
            where.assignedOfficerId = filters.assignedOfficerId === 'me' ? filters.requesterId ?? null : filters.assignedOfficerId;
        }
        const [items, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    citizen: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    assignedOfficer: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    },
                    feedback: {
                        select: {
                            satisfied: true,
                            createdAt: true
                        }
                    }
                }
            }),
            this.prisma.ticket.count({
                where
            })
        ]);
        return {
            items,
            total,
            page,
            pageSize
        };
    }
    mapAttachmentViews(attachments) {
        return attachments.map((attachment)=>({
                ...attachment,
                url: this.storage.getUrl(attachment.storedPath)
            }));
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Investigation (Milestone 4 — Phase 3)
    // ─────────────────────────────────────────────────────────────────────────
    /**
   * Ownership check for officer endpoints. The assigned officer, plus the
   * DEPARTMENT_HOD in the ticket's own department, may act on it. A Super Admin
   * bypasses. Also enforces the closed-ticket freeze (no writes once CLOSED).
   * Throws if not.
   */ async assertCanAct(ticketId, user) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                assignedOfficerId: true,
                departmentId: true,
                status: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        // Closed-ticket freeze applies to everyone (officer + HOD); only
        // Super Admin archive (a separate path) may touch a closed ticket.
        this.assertNotFrozen(ticket.status);
        if (user.isSuperAdmin) return;
        const isAssignee = ticket.assignedOfficerId === user.id;
        // The department HOD may also act (oversight).
        const isHodInDept = user.role === _role.Role.DEPARTMENT_HOD && !!ticket.departmentId && ticket.departmentId === user.departmentId;
        if (!isAssignee && !isHodInDept) {
            throw new _common.ForbiddenException('You are not assigned to this ticket.');
        }
    }
    /**
   * Officer starts or resumes investigation on an ASSIGNED/REOPENED ticket →
   * IN_PROGRESS. Reopened tickets keep their category, priority, department,
   * and assigned officer; they do not go back to classification.
   */ async start(id, user) {
        await this.assertCanAct(id, user);
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.IN_PROGRESS);
        await this.prisma.$transaction(async (tx)=>{
            await tx.ticket.update({
                where: {
                    id
                },
                data: {
                    status: _ticketstatus.TicketStatus.IN_PROGRESS
                }
            });
            await this.slaClock.start(tx, {
                id,
                priority: ticket.priority,
                slaStartedAt: ticket.slaStartedAt,
                slaTargetHours: ticket.slaTargetHours,
                awaiting: ticket.awaiting
            });
            await tx.ticketMovement.create({
                data: {
                    ticketId: id,
                    type: _ticketstatus.MovementType.ASSIGNED,
                    fromUserId: user.id,
                    note: ticket.status === _ticketstatus.TicketStatus.REOPENED ? 'Investigation resumed after citizen feedback' : 'Investigation started'
                }
            });
        });
        this.eventEmitter.emit('ticket.started', {
            ticketId: id
        });
        await this.audit.log({
            ticketId: id,
            actorId: user.id,
            eventType: _auditeventtype.AuditEventType.TICKET_STARTED
        });
        return {
            status: _ticketstatus.TicketStatus.IN_PROGRESS
        };
    }
    /**
   * Append a minute to the investigation sheet. Append-only — no update path.
   * Internal minutes are hidden from the citizen track view.
   */ async postMinute(id, dto, user) {
        await this.assertCanAct(id, user);
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        // Minutes can be posted once investigation has begun (IN_PROGRESS or later
        // active states). Guard against posting on un-started tickets.
        const activeStatuses = [
            _ticketstatus.TicketStatus.IN_PROGRESS,
            _ticketstatus.TicketStatus.PENDING_APPROVAL,
            _ticketstatus.TicketStatus.APPROVED,
            _ticketstatus.TicketStatus.REOPENED
        ];
        if (!activeStatuses.includes(ticket.status)) {
            throw new _common.BadRequestException('Cannot post a minute until the ticket is under investigation.');
        }
        const minute = await this.prisma.minute.create({
            data: {
                ticketId: id,
                authorId: user.id,
                body: dto.body,
                isInternal: dto.isInternal ?? false,
                isResolutionDraft: dto.isResolutionDraft ?? false
            }
        });
        await this.audit.log({
            ticketId: id,
            actorId: user.id,
            eventType: _auditeventtype.AuditEventType.MINUTE_POSTED,
            meta: {
                minuteId: minute.id,
                isInternal: dto.isInternal ?? false
            }
        });
        return {
            id: minute.id
        };
    }
    /**
   * Request more information from the citizen. Pauses the SLA clock
   * (awaiting = CITIZEN) and emits INFO_REQUESTED.
   */ async requestInfo(id, dto, user) {
        await this.assertCanAct(id, user);
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        // Must be actively under investigation to pause for info.
        if (ticket.status !== _ticketstatus.TicketStatus.IN_PROGRESS) {
            throw new _common.BadRequestException('Info requests are only allowed while the ticket is under investigation.');
        }
        const deadlineAt = dto.deadlineAt ? new Date(dto.deadlineAt) : undefined;
        await this.prisma.$transaction(async (tx)=>{
            await this.slaClock.pause(tx, id, _ticketstatus.AwaitingState.CITIZEN);
            await tx.minute.create({
                data: {
                    ticketId: id,
                    authorId: user.id,
                    body: `[Info requested from citizen] ${dto.requestText}`,
                    isInternal: true
                }
            });
        });
        this.eventEmitter.emit('ticket.info_requested', {
            ticketId: id,
            requestText: dto.requestText,
            deadlineAt
        });
        return {
            status: ticket.status,
            awaiting: _ticketstatus.AwaitingState.CITIZEN
        };
    }
    /**
   * Citizen replies to an info request (public, token-authenticated). Appends a
   * citizen minute, resumes the SLA clock, clears awaiting.
   */ async replyInfo(ticketCode, citizenId, dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                ticketCode
            },
            select: {
                id: true,
                citizenId: true,
                status: true,
                awaiting: true
            }
        });
        if (!ticket || ticket.citizenId !== citizenId) {
            throw new _common.NotFoundException('Ticket not found');
        }
        if (ticket.awaiting !== _ticketstatus.AwaitingState.CITIZEN) {
            throw new _common.BadRequestException('This ticket is not awaiting your response.');
        }
        await this.prisma.$transaction(async (tx)=>{
            await this.slaClock.resume(tx, ticket.id);
            // Citizen replies are recorded as non-internal minutes attributed to no
            // staff author — authorId is required by the schema, so we use a sentinel
            // pattern: store the reply as a movement note + a citizen-flagged minute.
            await tx.ticketMovement.create({
                data: {
                    ticketId: ticket.id,
                    type: _ticketstatus.MovementType.SUBMITTED,
                    note: `Citizen reply: ${dto.body.slice(0, 200)}`
                }
            });
        });
        return {
            status: ticket.status,
            awaiting: _ticketstatus.AwaitingState.NONE
        };
    }
    /**
   * Officer requests departmental approval (→ PENDING_APPROVAL). Creates a
   * PENDING ApprovalRequest addressed to the department HOD and pauses the SLA
   * clock (awaiting = APPROVAL). The decision flow is M5.
   */ async requestApproval(id, user) {
        await this.assertCanAct(id, user);
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.PENDING_APPROVAL);
        if (!ticket.departmentId) {
            throw new _common.BadRequestException('Ticket has no department to request approval from.');
        }
        // Resolve the department HOD as the first approver.
        const hod = await this.prisma.user.findFirst({
            where: {
                departmentId: ticket.departmentId,
                role: _role.Role.DEPARTMENT_HOD,
                isActive: true
            }
        });
        await this.prisma.$transaction(async (tx)=>{
            await tx.ticket.update({
                where: {
                    id
                },
                data: {
                    status: _ticketstatus.TicketStatus.PENDING_APPROVAL
                }
            });
            await this.slaClock.pause(tx, id, _ticketstatus.AwaitingState.APPROVAL);
            await tx.approvalRequest.create({
                data: {
                    ticketId: id,
                    requestedById: user.id,
                    approverRole: 'DEPARTMENT_HOD',
                    currentApproverId: hod?.id ?? null,
                    status: 'PENDING'
                }
            });
        });
        this.eventEmitter.emit('ticket.approval_requested', {
            ticketId: id
        });
        return {
            status: _ticketstatus.TicketStatus.PENDING_APPROVAL
        };
    }
    /**
   * Staff detail enriched with the investigation artefacts: minutes (for the
   * timeline), SLA snapshot, pauses, and approval requests. Internal minutes
   * are included (this is the staff view).
   */ async findDetailForStaff(id) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            },
            include: {
                citizen: true,
                attachments: true,
                department: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                assignedOfficer: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true,
                        designation: true,
                        email: true
                    }
                },
                movements: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    include: {
                        fromUser: {
                            select: {
                                fullName: true,
                                role: true
                            }
                        },
                        toUser: {
                            select: {
                                fullName: true,
                                role: true
                            }
                        }
                    }
                },
                minutes: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                fullName: true,
                                role: true,
                                designation: true
                            }
                        }
                    }
                },
                slaPauses: {
                    orderBy: {
                        startedAt: 'asc'
                    }
                },
                approvalRequests: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                },
                feedback: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        // Derive live SLA numbers so the UI doesn't have to recompute.
        const remaining = ticket.slaTargetHours ? await this.slaClock.remainingHours(id) : null;
        return {
            ...ticket,
            attachments: this.mapAttachmentViews(ticket.attachments),
            slaRemainingHours: remaining
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Resolution & Closure (Milestone 6 — Phases 6 & 7)
    // ─────────────────────────────────────────────────────────────────────────
    /**
   * Closed tickets are frozen — no further writes except SUPER_ADMIN archive.
   * Called by every mutating M4/M6 method. Throws ConflictException.
   */ assertNotFrozen(status) {
        if (status === _ticketstatus.TicketStatus.CLOSED) {
            throw new _common.ConflictException('This ticket is closed and can no longer be modified.');
        }
    }
    /**
   * Officer submits a resolution. IN_PROGRESS → RESOLVED, sets the feedback
   * grace deadline (resolvedAt + FEEDBACK_GRACE_DAYS), and notifies the citizen
   * with a feedback link.
   */ async submitResolution(id, dto, user) {
        await this.assertCanAct(id, user);
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        this.assertNotFrozen(ticket.status);
        this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.RESOLVED);
        const now = new Date();
        const graceDays = this.config.get('FEEDBACK_GRACE_DAYS') ?? 7;
        const feedbackGraceDueAt = new Date(now.getTime() + graceDays * 24 * 3600_000);
        await this.prisma.$transaction(async (tx)=>{
            await tx.ticket.update({
                where: {
                    id
                },
                data: {
                    status: _ticketstatus.TicketStatus.RESOLVED,
                    resolutionText: dto.resolutionText,
                    resolvedAt: now,
                    resolvedById: user.id,
                    feedbackGraceDueAt
                }
            });
            await tx.minute.create({
                data: {
                    ticketId: id,
                    authorId: user.id,
                    body: `[Resolution submitted] ${dto.resolutionText}`,
                    isInternal: false,
                    isResolutionDraft: false
                }
            });
            await tx.ticketMovement.create({
                data: {
                    ticketId: id,
                    type: _ticketstatus.MovementType.CLOSED,
                    fromUserId: user.id,
                    note: 'Resolution submitted for citizen confirmation'
                }
            });
        });
        this.eventEmitter.emit('ticket.resolved', {
            ticketId: id
        });
        await this.audit.log({
            ticketId: id,
            actorId: user.id,
            eventType: _auditeventtype.AuditEventType.TICKET_RESOLVED
        });
        return {
            status: _ticketstatus.TicketStatus.RESOLVED
        };
    }
    /**
   * Citizen feedback (public, token-auth). Satisfied → CLOSED; not → REOPENED.
   * 1:1 — a second feedback attempt throws ConflictException.
   */ async submitFeedback(ticketCode, citizenId, dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                ticketCode
            },
            select: {
                id: true,
                citizenId: true,
                status: true,
                resolvedAt: true,
                reopenCount: true
            }
        });
        if (!ticket || ticket.citizenId !== citizenId) {
            throw new _common.NotFoundException('Ticket not found');
        }
        if (ticket.status !== _ticketstatus.TicketStatus.RESOLVED) {
            throw new _common.BadRequestException('Feedback is only accepted after a resolution has been submitted.');
        }
        // Enforce the reopen window on unsatisfied feedback.
        if (!dto.satisfied) {
            this.assertWithinReopenWindow(ticket.resolvedAt);
        }
        // 1:1 — reject duplicate feedback.
        const existing = await this.prisma.feedback.findUnique({
            where: {
                ticketId: ticket.id
            }
        });
        if (existing) {
            throw new _common.ConflictException('You have already submitted feedback for this ticket.');
        }
        if (dto.satisfied) {
            await this.close(ticket.id, 'citizen_confirmed');
            await this.prisma.feedback.create({
                data: {
                    ticketId: ticket.id,
                    satisfied: true,
                    rating: dto.rating,
                    comment: dto.comment
                }
            });
            this.eventEmitter.emit('ticket.closed', {
                ticketId: ticket.id
            });
            await this.audit.log({
                ticketId: ticket.id,
                eventType: _auditeventtype.AuditEventType.TICKET_CLOSED,
                meta: {
                    reason: 'citizen_confirmed',
                    rating: dto.rating
                }
            });
            return {
                status: _ticketstatus.TicketStatus.CLOSED
            };
        }
        // Not satisfied → reopen.
        const reopenCount = await this.reopenInternal(ticket.id, dto.comment ?? 'Citizen rejected resolution');
        await this.prisma.feedback.create({
            data: {
                ticketId: ticket.id,
                satisfied: false,
                rating: dto.rating,
                comment: dto.comment
            }
        });
        this.eventEmitter.emit('ticket.reopened', {
            ticketId: ticket.id,
            reopenReason: dto.comment ?? 'Citizen rejected the resolution',
            reopenCount
        });
        await this.audit.log({
            ticketId: ticket.id,
            eventType: _auditeventtype.AuditEventType.TICKET_REOPENED,
            meta: {
                reopenCount,
                comment: dto.comment
            }
        });
        return {
            status: _ticketstatus.TicketStatus.REOPENED
        };
    }
    async submitFeedbackWithPasscode(ticketCode, passcode, dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                ticketCode
            },
            select: {
                citizenId: true,
                trackingPasscode: true
            }
        });
        if (!ticket || ticket.trackingPasscode !== passcode) {
            throw new _common.NotFoundException('Ticket not found or invalid passcode');
        }
        return this.submitFeedback(ticketCode, ticket.citizenId, dto);
    }
    /**
   * Citizen explicit reopen (alternative entry). Subject to the 14-day window.
   */ async reopen(ticketCode, citizenId, dto) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                ticketCode
            },
            select: {
                id: true,
                citizenId: true,
                status: true,
                resolvedAt: true
            }
        });
        if (!ticket || ticket.citizenId !== citizenId) {
            throw new _common.NotFoundException('Ticket not found');
        }
        if (ticket.status !== _ticketstatus.TicketStatus.RESOLVED) {
            throw new _common.BadRequestException('Only resolved tickets can be reopened.');
        }
        this.assertWithinReopenWindow(ticket.resolvedAt);
        const reopenCount = await this.reopenInternal(ticket.id, dto.reason);
        this.eventEmitter.emit('ticket.reopened', {
            ticketId: ticket.id,
            reopenReason: dto.reason,
            reopenCount
        });
        return {
            status: _ticketstatus.TicketStatus.REOPENED,
            reopenCount
        };
    }
    /**
   * Shared reopen logic: RESOLVED → REOPENED, increment count, write movement.
   * Emits REOPEN_ESCALATION at reopenCount >= 2. Returns the new count.
   */ async reopenInternal(ticketId, reason) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                status: true,
                reopenCount: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.REOPENED);
        const now = new Date();
        const newCount = ticket.reopenCount + 1;
        await this.prisma.$transaction(async (tx)=>{
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: _ticketstatus.TicketStatus.REOPENED,
                    reopenCount: newCount,
                    lastReopenedAt: now
                }
            });
            await tx.ticketMovement.create({
                data: {
                    ticketId,
                    type: _ticketstatus.MovementType.REOPENED,
                    note: reason
                }
            });
        });
        if (newCount >= 2) {
            this.eventEmitter.emit('ticket.reopen_escalation', {
                ticketId,
                reopenCount: newCount
            });
        }
        return newCount;
    }
    /** Throw 410 Gone if the reopen window (default 14d) has elapsed. */ assertWithinReopenWindow(resolvedAt) {
        if (!resolvedAt) return;
        const windowDays = this.config.get('REOPEN_WINDOW_DAYS') ?? 14;
        const deadline = new Date(resolvedAt.getTime() + windowDays * 24 * 3600_000);
        if (new Date() > deadline) {
            throw new _common.GoneException(`The ${windowDays}-day window to reopen this complaint has expired.`);
        }
    }
    /**
   * Close a ticket (citizen-confirmed or auto-close). Centralized so the cron
   * and the feedback path share one implementation.
   */ async close(ticketId, reason) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                status: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        this.stateMachine.assertCanTransition(ticket.status, _ticketstatus.TicketStatus.CLOSED);
        await this.prisma.$transaction(async (tx)=>{
            await tx.ticket.update({
                where: {
                    id: ticketId
                },
                data: {
                    status: _ticketstatus.TicketStatus.CLOSED,
                    closedAt: new Date(),
                    closedReason: reason
                }
            });
            await tx.ticketMovement.create({
                data: {
                    ticketId,
                    type: _ticketstatus.MovementType.CLOSED,
                    note: reason
                }
            });
        });
    }
    /**
   * Auto-close resolved tickets whose feedback grace has elapsed with no
   * feedback. Called by the daily cron. Idempotent: CLOSED tickets no longer
   * match the query. Returns the count closed.
   */ async autoCloseOverdue() {
        const overdue = await this.prisma.ticket.findMany({
            where: {
                status: _ticketstatus.TicketStatus.RESOLVED,
                feedbackGraceDueAt: {
                    lt: new Date()
                },
                feedback: null
            },
            select: {
                id: true
            }
        });
        for (const t of overdue){
            await this.close(t.id, 'auto_closed');
            this.eventEmitter.emit('ticket.auto.closed', {
                ticketId: t.id
            });
        }
        return overdue.length;
    }
    /**
   * Archive a closed ticket (SUPER_ADMIN or retention). Read-only thereafter.
   */ async archive(ticketId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: {
                id: ticketId
            },
            select: {
                status: true,
                archived: true
            }
        });
        if (!ticket) throw new _common.NotFoundException('Ticket not found');
        if (ticket.status !== _ticketstatus.TicketStatus.CLOSED) {
            throw new _common.BadRequestException('Only closed tickets can be archived.');
        }
        await this.prisma.ticket.update({
            where: {
                id: ticketId
            },
            data: {
                archived: true,
                archivedAt: new Date()
            }
        });
        return {
            archived: true
        };
    }
    /** Staff list of reopened tickets (admin monitoring/escalation view). */ async findReopened(filters) {
        const { departmentId, page = 1, pageSize = 20 } = filters;
        const where = {
            status: _ticketstatus.TicketStatus.REOPENED
        };
        if (departmentId) where.departmentId = departmentId;
        const [items, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: {
                    lastReopenedAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    citizen: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    department: {
                        select: {
                            name: true
                        }
                    }
                }
            }),
            this.prisma.ticket.count({
                where
            })
        ]);
        return {
            items,
            total,
            page,
            pageSize
        };
    }
    /** Staff list of archived tickets (read-only archive view). */ async findArchived(filters) {
        const { departmentId, category, page = 1, pageSize = 20 } = filters;
        const where = {
            archived: true
        };
        if (departmentId) where.departmentId = departmentId;
        if (category) where.category = category;
        const [items, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: {
                    archivedAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    citizen: {
                        select: {
                            name: true,
                            email: true
                        }
                    },
                    department: {
                        select: {
                            name: true
                        }
                    }
                }
            }),
            this.prisma.ticket.count({
                where
            })
        ]);
        return {
            items,
            total,
            page,
            pageSize
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Overhaul Phase 1.2 — SUPER_ADMIN / AUDITOR "all tickets with full timeline"
    //
    // Unlike `findMany`, this returns tickets across ALL departments and embeds
    // the full AuditEvent timeline (`events`) for each ticket — so the admin UI
    // can render a complete activity feed per row without a second round trip.
    // The activity timeline is sourced from `AuditEvent` rows (the system's
    // append-only event log: one row per state change / officer action / SLA
    // event). The Prisma relation `ticket.auditEvents` is renamed to `events`
    // in the response to match the API contract.
    // ─────────────────────────────────────────────────────────────────────────
    async findAllWithTimeline(filters) {
        const { status, departmentId, priority, search, page = 1, pageSize = 20 } = filters;
        // Clamp page ≥ 1 and 1 ≤ pageSize ≤ 100 per the contract.
        const safePage = Math.max(1, Math.floor(page));
        const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
        const where = {
            archived: false
        };
        if (status) where.status = status;
        if (departmentId) where.departmentId = departmentId;
        if (priority) where.priority = priority;
        if (search) {
            const term = search.trim();
            if (term) {
                where.OR = [
                    {
                        ticketCode: {
                            contains: term
                        }
                    },
                    {
                        subject: {
                            contains: term
                        }
                    },
                    {
                        description: {
                            contains: term
                        }
                    }
                ];
            }
        }
        const [rawItems, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (safePage - 1) * safePageSize,
                take: safePageSize,
                include: {
                    citizen: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    assignedOfficer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    auditEvents: {
                        orderBy: {
                            createdAt: 'asc'
                        },
                        include: {
                            actor: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            }),
            this.prisma.ticket.count({
                where
            })
        ]);
        // Map each AuditEvent into the API contract the timeline UI expects:
        // `eventType` → `type`, the nested `actor` is flattened to
        // `actorName` / `actorRole`, and `meta` → `note`.
        const items = rawItems.map(({ auditEvents, ...rest })=>({
                ...rest,
                events: (auditEvents ?? []).map((e)=>({
                        id: e.id,
                        type: e.eventType,
                        note: e.meta ?? null,
                        createdAt: e.createdAt,
                        actorName: e.actor?.fullName ?? null,
                        actorRole: e.actor?.role ?? null
                    }))
            }));
        const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);
        return {
            items,
            total,
            page: safePage,
            pageSize: safePageSize,
            totalPages
        };
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Overhaul Phase 1.3 — Department-scoped ticket listing with stats.
    //
    // Used by ADMIN_OFFICER / DIRECTOR / PS / AUDITOR / SUPER_ADMIN dashboards.
    // `stats` is computed against the *unfiltered* department scope (ignoring
    // status/priority/officer filters) so the UI can show department-wide
    // breakdowns alongside the filtered list. The top-level `total` is the
    // filtered count (drives pagination).
    // ─────────────────────────────────────────────────────────────────────────
    async findByDepartment(departmentId, filters) {
        const { status, priority, assignedOfficerId, page = 1, pageSize = 20 } = filters;
        const safePage = Math.max(1, Math.floor(page));
        const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
        const where = {
            departmentId,
            archived: false
        };
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedOfficerId) {
            // Sentinel `me` is intentionally NOT resolved here — department viewers
            // (HOD/PS/Auditor) legitimately query other officers' assignments. Only
            // the explicit id is honoured.
            where.assignedOfficerId = assignedOfficerId;
        }
        // Unfiltered base scope for the stats block (department-wide totals).
        const statsWhere = {
            departmentId,
            archived: false
        };
        const [items, total, statusGroups, priorityGroups, deptTotal] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: (safePage - 1) * safePageSize,
                take: safePageSize,
                include: {
                    citizen: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    },
                    assignedOfficer: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    }
                }
            }),
            this.prisma.ticket.count({
                where
            }),
            this.prisma.ticket.groupBy({
                by: [
                    'status'
                ],
                where: statsWhere,
                _count: {
                    _all: true
                }
            }),
            this.prisma.ticket.groupBy({
                by: [
                    'priority'
                ],
                where: statsWhere,
                _count: {
                    _all: true
                }
            }),
            this.prisma.ticket.count({
                where: statsWhere
            })
        ]);
        const byStatus = {};
        for (const g of statusGroups)byStatus[g.status] = g._count._all;
        const byPriority = {};
        for (const g of priorityGroups){
            // Priority is nullable until triage; bucket null as UNPRIORITIZED so the
            // UI has a stable key.
            const key = g.priority ?? 'UNPRIORITIZED';
            byPriority[key] = g._count._all;
        }
        return {
            items,
            total,
            page: safePage,
            pageSize: safePageSize,
            stats: {
                total: deptTotal,
                byStatus,
                byPriority
            }
        };
    }
};
TicketsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(9, (0, _common.Inject)(_storageservice.STORAGE_SERVICE)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _ticketidgenerator.TicketIdGenerator === "undefined" ? Object : _ticketidgenerator.TicketIdGenerator,
        typeof _trackingtokenservice.TrackingTokenService === "undefined" ? Object : _trackingtokenservice.TrackingTokenService,
        typeof _ticketstatemachine.TicketStateMachine === "undefined" ? Object : _ticketstatemachine.TicketStateMachine,
        typeof _eventemitter.EventEmitter2 === "undefined" ? Object : _eventemitter.EventEmitter2,
        typeof _routingservice.RoutingService === "undefined" ? Object : _routingservice.RoutingService,
        typeof _slaclockservice.SlaClockService === "undefined" ? Object : _slaclockservice.SlaClockService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService,
        typeof _storageservice.StorageService === "undefined" ? Object : _storageservice.StorageService
    ])
], TicketsService);

//# sourceMappingURL=tickets.service.js.map