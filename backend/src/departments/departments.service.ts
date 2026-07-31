import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dtos/create-department.dto';
import { UpdateDepartmentDto } from './dtos/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns all departments, ordered by name. */
  findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, description: true },
    });
  }

  findByCode(code: string) {
    return this.prisma.department.findUnique({ where: { code } });
  }

  /** Create a department. */
  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Department code "${dto.code}" already exists.`);
    }
    return this.prisma.department.create({
      data: { name: dto.name, code: dto.code, description: dto.description },
      select: { id: true, name: true, code: true, description: true },
    });
  }

  /** Update a department. */
  async update(id: string, dto: UpdateDepartmentDto) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found.');

    if (dto.code && dto.code !== dept.code) {
      const clash = await this.prisma.department.findUnique({
        where: { code: dto.code },
      });
      if (clash) {
        throw new ConflictException(`Department code "${dto.code}" already exists.`);
      }
    }
    return this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
      },
      select: { id: true, name: true, code: true, description: true },
    });
  }

  /**
   * Delete a department — only if it has no active users or open tickets
   * (referential integrity). Otherwise throw 409 with a helpful message.
   */
  async remove(id: string) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException('Department not found.');

    const [activeUsers, openTickets] = await Promise.all([
      this.prisma.user.count({ where: { departmentId: id, isActive: true } }),
      this.prisma.ticket.count({
        where: {
          departmentId: id,
          status: { notIn: ['CLOSED'] },
        },
      }),
    ]);
    if (activeUsers > 0 || openTickets > 0) {
      throw new ConflictException(
        `Cannot delete: department has ${activeUsers} active user(s) and ${openTickets} open ticket(s). Reassign them first.`,
      );
    }
    await this.prisma.department.delete({ where: { id } });
    return { id, deleted: true };
  }
}
