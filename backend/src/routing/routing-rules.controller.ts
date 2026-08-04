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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Role } from '../common/types/role';
import { Permission } from '../common/types/permission';
import { CreateRoutingRuleDto } from './dtos/create-routing-rule.dto';
import { UpdateRoutingRuleDto } from './dtos/update-routing-rule.dto';
import { NotFoundException } from '@nestjs/common';

@ApiTags('routing-rules')
@Controller('routing-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Permissions(Permission.ROUTING)
export class RoutingRulesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all routing rules (Super Admin)' })
  async list() {
    return this.prisma.routingRule.findMany({
      orderBy: [{ category: 'asc' }, { priorityRank: 'desc' }],
      include: { department: { select: { id: true, name: true, code: true } } },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a routing rule (Super Admin)' })
  async create(@Body() dto: CreateRoutingRuleDto) {
    return this.prisma.routingRule.create({
      data: {
        category: dto.category,
        priority: dto.priority as any,
        lga: dto.lga,
        departmentId: dto.departmentId,
        defaultOfficerId: dto.defaultOfficerId,
        priorityRank: dto.priorityRank ?? 0,
        isActive: dto.isActive ?? true,
      },
      include: { department: { select: { id: true, name: true, code: true } } },
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a routing rule (Super Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateRoutingRuleDto) {
    const existing = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Routing rule not found');

    return this.prisma.routingRule.update({
      where: { id },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.priority !== undefined && { priority: dto.priority as any }),
        ...(dto.lga !== undefined && { lga: dto.lga }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.defaultOfficerId !== undefined && { defaultOfficerId: dto.defaultOfficerId }),
        ...(dto.priorityRank !== undefined && { priorityRank: dto.priorityRank }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { department: { select: { id: true, name: true, code: true } } },
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a routing rule (Super Admin)' })
  async remove(@Param('id') id: string) {
    const existing = await this.prisma.routingRule.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Routing rule not found');

    await this.prisma.routingRule.delete({ where: { id } });
    return { deleted: true };
  }
}
