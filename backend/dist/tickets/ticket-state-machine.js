"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TicketStateMachine", {
    enumerable: true,
    get: function() {
        return TicketStateMachine;
    }
});
const _common = require("@nestjs/common");
const _ticketstatus = require("../common/types/ticket-status");
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
let TicketStateMachine = class TicketStateMachine {
    canTransition(from, to) {
        const allowed = this.transitions[from] ?? [];
        return allowed.includes(to);
    }
    assertCanTransition(from, to) {
        if (!this.canTransition(from, to)) {
            throw new _common.BadRequestException(`Illegal status transition: ${from} → ${to}`);
        }
    }
    constructor(){
        this.transitions = {
            [_ticketstatus.TicketStatus.SUBMITTED]: [
                _ticketstatus.TicketStatus.ACKNOWLEDGED
            ],
            [_ticketstatus.TicketStatus.ACKNOWLEDGED]: [
                _ticketstatus.TicketStatus.TRIAGED
            ],
            [_ticketstatus.TicketStatus.TRIAGED]: [
                _ticketstatus.TicketStatus.ASSIGNED
            ],
            [_ticketstatus.TicketStatus.ASSIGNED]: [
                _ticketstatus.TicketStatus.IN_PROGRESS
            ],
            [_ticketstatus.TicketStatus.IN_PROGRESS]: [
                _ticketstatus.TicketStatus.PENDING_APPROVAL,
                _ticketstatus.TicketStatus.RESOLVED
            ],
            [_ticketstatus.TicketStatus.PENDING_APPROVAL]: [
                _ticketstatus.TicketStatus.APPROVED,
                _ticketstatus.TicketStatus.IN_PROGRESS
            ],
            [_ticketstatus.TicketStatus.APPROVED]: [
                _ticketstatus.TicketStatus.IN_PROGRESS
            ],
            [_ticketstatus.TicketStatus.RESOLVED]: [
                _ticketstatus.TicketStatus.CLOSED,
                _ticketstatus.TicketStatus.REOPENED
            ],
            [_ticketstatus.TicketStatus.REOPENED]: [
                _ticketstatus.TicketStatus.IN_PROGRESS
            ],
            [_ticketstatus.TicketStatus.CLOSED]: [],
            [_ticketstatus.TicketStatus.ESCALATED]: [],
            [_ticketstatus.TicketStatus.REFERRED]: []
        };
    }
};
TicketStateMachine = _ts_decorate([
    (0, _common.Injectable)()
], TicketStateMachine);

//# sourceMappingURL=ticket-state-machine.js.map