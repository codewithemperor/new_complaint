import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';
import { DepartmentResponseDto } from './dtos/department-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Role } from '../common/types/role';
import { Permission } from '../common/types/permission';

/**
 * Departments controller.
 *  - GET /departments — any authenticated staff (for selectors).
 *  - POST/PATCH/DELETE — Super Admin, or ADMIN with the DEPARTMENTS permission.
 */
@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all departments' })
  findAll(): Promise<DepartmentResponseDto[]> {
    return this.departmentsService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.DEPARTMENTS)
  @Post()
  @ApiOperation({ summary: 'Create a department (admin)' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.DEPARTMENTS)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a department (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Permissions(Permission.DEPARTMENTS)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a department (admin)' })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
