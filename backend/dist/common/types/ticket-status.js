/**
 * Ticket status enum — local reflection-friendly copy.
 * Mirrors the Prisma-generated TicketStatus enum (generated/prisma/enums).
 *
 * Same rationale as Role: the Prisma 7 generated client is TS-source, and
 * importing its enum into DTOs confuses Swagger metadata reflection under SWC.
 * Kept in sync manually with the Prisma enum.
 *
 * See planning/03-ticket-workflow.md for the full transition table.
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get ApprovalStatus () {
        return ApprovalStatus;
    },
    get ApproverRole () {
        return ApproverRole;
    },
    get AwaitingState () {
        return AwaitingState;
    },
    get Channel () {
        return Channel;
    },
    get MovementType () {
        return MovementType;
    },
    get Priority () {
        return Priority;
    },
    get Sensitivity () {
        return Sensitivity;
    },
    get TicketStatus () {
        return TicketStatus;
    }
});
var TicketStatus = /*#__PURE__*/ function(TicketStatus) {
    TicketStatus["SUBMITTED"] = "SUBMITTED";
    TicketStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    TicketStatus["TRIAGED"] = "TRIAGED";
    TicketStatus["ASSIGNED"] = "ASSIGNED";
    TicketStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TicketStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    TicketStatus["APPROVED"] = "APPROVED";
    TicketStatus["RESOLVED"] = "RESOLVED";
    TicketStatus["CLOSED"] = "CLOSED";
    TicketStatus["REOPENED"] = "REOPENED";
    TicketStatus["ESCALATED"] = "ESCALATED";
    TicketStatus["REFERRED"] = "REFERRED";
    return TicketStatus;
}({});
var Channel = /*#__PURE__*/ function(Channel) {
    Channel["WEB"] = "WEB";
    Channel["WALK_IN"] = "WALK_IN";
    Channel["PHONE"] = "PHONE";
    Channel["LETTER"] = "LETTER";
    Channel["EMAIL"] = "EMAIL";
    return Channel;
}({});
var Priority = /*#__PURE__*/ function(Priority) {
    Priority["P1"] = "P1";
    Priority["P2"] = "P2";
    Priority["P3"] = "P3";
    Priority["P4"] = "P4";
    return Priority;
}({});
var Sensitivity = /*#__PURE__*/ function(Sensitivity) {
    Sensitivity["NORMAL"] = "NORMAL";
    Sensitivity["SENSITIVE"] = "SENSITIVE";
    Sensitivity["CONFIDENTIAL"] = "CONFIDENTIAL";
    return Sensitivity;
}({});
var MovementType = /*#__PURE__*/ function(MovementType) {
    MovementType["SUBMITTED"] = "SUBMITTED";
    MovementType["ROUTED"] = "ROUTED";
    MovementType["ASSIGNED"] = "ASSIGNED";
    MovementType["REASSIGNED"] = "REASSIGNED";
    MovementType["RETURNED"] = "RETURNED";
    MovementType["ESCALATED"] = "ESCALATED";
    MovementType["APPROVED"] = "APPROVED";
    MovementType["REFERRED"] = "REFERRED";
    MovementType["REOPENED"] = "REOPENED";
    MovementType["CLOSED"] = "CLOSED";
    MovementType["AUTO_ESCALATED"] = "AUTO_ESCALATED";
    return MovementType;
}({});
var AwaitingState = /*#__PURE__*/ function(AwaitingState) {
    AwaitingState["NONE"] = "NONE";
    AwaitingState["CITIZEN"] = "CITIZEN";
    AwaitingState["DEPARTMENT"] = "DEPARTMENT";
    AwaitingState["APPROVAL"] = "APPROVAL";
    return AwaitingState;
}({});
var ApproverRole = /*#__PURE__*/ function(ApproverRole) {
    ApproverRole["DIRECTOR"] = "DIRECTOR";
    ApproverRole["PERMANENT_SECRETARY"] = "PERMANENT_SECRETARY";
    ApproverRole["COMMISSIONER"] = "COMMISSIONER";
    return ApproverRole;
}({});
var ApprovalStatus = /*#__PURE__*/ function(ApprovalStatus) {
    ApprovalStatus["PENDING"] = "PENDING";
    ApprovalStatus["APPROVED"] = "APPROVED";
    ApprovalStatus["REJECTED"] = "REJECTED";
    ApprovalStatus["RETURNED"] = "RETURNED";
    ApprovalStatus["ESCALATED"] = "ESCALATED";
    ApprovalStatus["REFERRED"] = "REFERRED";
    return ApprovalStatus;
}({});

//# sourceMappingURL=ticket-status.js.map