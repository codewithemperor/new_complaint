/**
 * AuditEventType — local reflection-friendly copy. Mirrors the Prisma-generated
 * enum (same rationale as Role/TicketStatus: avoids SWC reflection issues).
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditEventType", {
    enumerable: true,
    get: function() {
        return AuditEventType;
    }
});
var AuditEventType = /*#__PURE__*/ function(AuditEventType) {
    AuditEventType["TICKET_ACKNOWLEDGED"] = "TICKET_ACKNOWLEDGED";
    AuditEventType["TICKET_STARTED"] = "TICKET_STARTED";
    AuditEventType["TICKET_ASSIGNED"] = "TICKET_ASSIGNED";
    AuditEventType["TICKET_ROUTED"] = "TICKET_ROUTED";
    AuditEventType["INFO_REQUESTED"] = "INFO_REQUESTED";
    AuditEventType["APPROVAL_REQUESTED"] = "APPROVAL_REQUESTED";
    AuditEventType["TICKET_APPROVED"] = "TICKET_APPROVED";
    AuditEventType["TICKET_RETURNED"] = "TICKET_RETURNED";
    AuditEventType["ESCALATION_TO_PS"] = "ESCALATION_TO_PS";
    AuditEventType["ESCALATION_TO_COMMISSIONER"] = "ESCALATION_TO_COMMISSIONER";
    AuditEventType["PS_DECISION"] = "PS_DECISION";
    AuditEventType["COMMISSIONER_DECISION"] = "COMMISSIONER_DECISION";
    AuditEventType["EXTERNAL_REFERRAL"] = "EXTERNAL_REFERRAL";
    AuditEventType["TICKET_RESOLVED"] = "TICKET_RESOLVED";
    AuditEventType["TICKET_CLOSED"] = "TICKET_CLOSED";
    AuditEventType["TICKET_AUTO_CLOSED"] = "TICKET_AUTO_CLOSED";
    AuditEventType["TICKET_REOPENED"] = "TICKET_REOPENED";
    AuditEventType["REOPEN_ESCALATION"] = "REOPEN_ESCALATION";
    AuditEventType["SLA_WARNING"] = "SLA_WARNING";
    AuditEventType["SLA_BREACH_ESCALATION"] = "SLA_BREACH_ESCALATION";
    AuditEventType["TICKET_TRIAGED"] = "TICKET_TRIAGED";
    AuditEventType["MINUTE_POSTED"] = "MINUTE_POSTED";
    AuditEventType["CITIZEN_INFO_REPLY"] = "CITIZEN_INFO_REPLY";
    AuditEventType["TICKET_ARCHIVED"] = "TICKET_ARCHIVED";
    return AuditEventType;
}({});

//# sourceMappingURL=audit-event-type.js.map