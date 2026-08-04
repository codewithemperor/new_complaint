"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersController", {
    enumerable: true,
    get: function() {
        return UsersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _usersservice = require("./users.service");
const _createuserdto = require("./dtos/create-user.dto");
const _updateuserdto = require("./dtos/update-user.dto");
const _jwtauthguard = require("../common/guards/jwt-auth.guard");
const _rolesguard = require("../common/guards/roles.guard");
const _rolesdecorator = require("../common/decorators/roles.decorator");
const _permissionsdecorator = require("../common/decorators/permissions.decorator");
const _role = require("../common/types/role");
const _permission = require("../common/types/permission");
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
let UsersController = class UsersController {
    constructor(usersService){
        this.usersService = usersService;
    }
    async list(role, departmentId, isActive, page, pageSize) {
        return this.usersService.findMany({
            role,
            departmentId,
            isActive: isActive === undefined ? undefined : isActive === 'true',
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined
        });
    }
    async create(dto) {
        return this.usersService.create(dto);
    }
    async update(id, dto) {
        return this.usersService.update(id, dto);
    }
    async deactivate(id) {
        return this.usersService.deactivate(id);
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List staff users (Super Admin)'
    }),
    (0, _swagger.ApiQuery)({
        name: 'role',
        required: false,
        enum: _role.Role
    }),
    (0, _swagger.ApiQuery)({
        name: 'departmentId',
        required: false
    }),
    (0, _swagger.ApiQuery)({
        name: 'isActive',
        required: false,
        type: Boolean
    }),
    _ts_param(0, (0, _common.Query)('role')),
    _ts_param(1, (0, _common.Query)('departmentId')),
    _ts_param(2, (0, _common.Query)('isActive')),
    _ts_param(3, (0, _common.Query)('page')),
    _ts_param(4, (0, _common.Query)('pageSize')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _role.Role === "undefined" ? Object : _role.Role,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "list", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: 'Create a staff user (Super Admin)'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createuserdto.CreateUserDto === "undefined" ? Object : _createuserdto.CreateUserDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Update a staff user (Super Admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateuserdto.UpdateUserDto === "undefined" ? Object : _updateuserdto.UpdateUserDto
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Deactivate a staff user (Super Admin, soft delete)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "deactivate", null);
UsersController = _ts_decorate([
    (0, _swagger.ApiTags)('users'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.USERS),
    (0, _common.Controller)('users'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService
    ])
], UsersController);

//# sourceMappingURL=users.controller.js.map