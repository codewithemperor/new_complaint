import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Role } from '../common/types/role';
import { Permission } from '../common/types/permission';

/**
 * Users controller — admin user management (CRUD).
 *
 * Accessible to Super Admins (ADMIN + isSuperAdmin) and ADMIN users granted the
 * USERS permission. Read-side access for auth/jwt stays in AuthService; this
 * controller is the admin write boundary. Deletes are soft (deactivate) to
 * preserve history.
 */
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Permissions(Permission.USERS)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List staff users (Super Admin)' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async list(
    @Query('role') role?: Role,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.findMany({
      role,
      departmentId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff user (Super Admin)' })
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff user (Super Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a staff user (Super Admin, soft delete)' })
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
