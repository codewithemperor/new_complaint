"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RemindersController", {
    enumerable: true,
    get: function() {
        return RemindersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _currentuserdecorator = require("../common/decorators/current-user.decorator");
const _remindersservice = require("./reminders.service");
const _createreminderdto = require("./dtos/create-reminder.dto");
const _updatereminderdto = require("./dtos/update-reminder.dto");
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
let RemindersController = class RemindersController {
    constructor(remindersService){
        this.remindersService = remindersService;
    }
    async create(user, dto) {
        return this.remindersService.create(user.id, dto);
    }
    async list(user) {
        return this.remindersService.list(user.id);
    }
    async listByTicket(user, ticketId) {
        return this.remindersService.listByTicket(user.id, ticketId);
    }
    async update(user, id, dto) {
        return this.remindersService.update(id, user.id, dto);
    }
    async delete(user, id) {
        return this.remindersService.delete(id, user.id);
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: 'Create a reminder for a ticket'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser,
        typeof _createreminderdto.CreateReminderDto === "undefined" ? Object : _createreminderdto.CreateReminderDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RemindersController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List all active reminders for the current user'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser
    ]),
    _ts_metadata("design:returntype", Promise)
], RemindersController.prototype, "list", null);
_ts_decorate([
    (0, _common.Get)('ticket/:ticketId'),
    (0, _swagger.ApiOperation)({
        summary: 'List reminders for a specific ticket'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('ticketId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], RemindersController.prototype, "listByTicket", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Update a reminder (owner only)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser,
        String,
        typeof _updatereminderdto.UpdateReminderDto === "undefined" ? Object : _updatereminderdto.UpdateReminderDto
    ]),
    _ts_metadata("design:returntype", Promise)
], RemindersController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Delete a reminder (owner only)'
    }),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof AuthenticatedUser === "undefined" ? Object : AuthenticatedUser,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], RemindersController.prototype, "delete", null);
RemindersController = _ts_decorate([
    (0, _swagger.ApiTags)('reminders'),
    (0, _common.Controller)('reminders'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _remindersservice.RemindersService === "undefined" ? Object : _remindersservice.RemindersService
    ])
], RemindersController);

//# sourceMappingURL=reminders.controller.js.map