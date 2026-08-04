"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DepartmentsController", {
    enumerable: true,
    get: function() {
        return DepartmentsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _departmentsservice = require("./departments.service");
const _createdepartmentdto = require("./dtos/create-department.dto");
const _updatedepartmentdto = require("./dtos/update-department.dto");
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
let DepartmentsController = class DepartmentsController {
    constructor(departmentsService){
        this.departmentsService = departmentsService;
    }
    findAll() {
        return this.departmentsService.findAll();
    }
    create(dto) {
        return this.departmentsService.create(dto);
    }
    update(id, dto) {
        return this.departmentsService.update(id, dto);
    }
    remove(id) {
        return this.departmentsService.remove(id);
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: 'List all departments'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], DepartmentsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.UseGuards)(_rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.DEPARTMENTS),
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: 'Create a department (admin)'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createdepartmentdto.CreateDepartmentDto === "undefined" ? Object : _createdepartmentdto.CreateDepartmentDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DepartmentsController.prototype, "create", null);
_ts_decorate([
    (0, _common.UseGuards)(_rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.DEPARTMENTS),
    (0, _common.Patch)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Update a department (admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updatedepartmentdto.UpdateDepartmentDto === "undefined" ? Object : _updatedepartmentdto.UpdateDepartmentDto
    ]),
    _ts_metadata("design:returntype", void 0)
], DepartmentsController.prototype, "update", null);
_ts_decorate([
    (0, _common.UseGuards)(_rolesguard.RolesGuard),
    (0, _rolesdecorator.Roles)(_role.Role.ADMIN),
    (0, _permissionsdecorator.Permissions)(_permission.Permission.DEPARTMENTS),
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: 'Delete a department (admin)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], DepartmentsController.prototype, "remove", null);
DepartmentsController = _ts_decorate([
    (0, _swagger.ApiTags)('departments'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('departments'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _departmentsservice.DepartmentsService === "undefined" ? Object : _departmentsservice.DepartmentsService
    ])
], DepartmentsController);

//# sourceMappingURL=departments.controller.js.map