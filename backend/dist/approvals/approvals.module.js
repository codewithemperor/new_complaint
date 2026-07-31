"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApprovalsModule", {
    enumerable: true,
    get: function() {
        return ApprovalsModule;
    }
});
const _common = require("@nestjs/common");
const _approvalscontroller = require("./approvals.controller");
const _approvalworkflowservice = require("./approval-workflow.service");
const _escalationservice = require("./escalation.service");
const _delegationsservice = require("./delegations.service");
const _slamodule = require("../sla/sla.module");
const _slaschedulerservice = require("../sla/sla-scheduler.service");
const _ticketsmodule = require("../tickets/tickets.module");
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
let ApprovalsModule = class ApprovalsModule {
};
ApprovalsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _slamodule.SlaModule,
            _ticketsmodule.TicketsModule
        ],
        controllers: [
            _approvalscontroller.ApprovalsController
        ],
        providers: [
            _approvalworkflowservice.ApprovalWorkflowService,
            _escalationservice.EscalationService,
            _delegationsservice.DelegationsService,
            _slaschedulerservice.SlaScheduler
        ],
        exports: [
            _escalationservice.EscalationService,
            _approvalworkflowservice.ApprovalWorkflowService
        ]
    })
], ApprovalsModule);

//# sourceMappingURL=approvals.module.js.map